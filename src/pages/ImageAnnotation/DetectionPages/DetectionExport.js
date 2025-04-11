// src/pages/DetectionExport.js
import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { create } from 'xmlbuilder2';
import './DetectionExport.css';

/* --------------------- Helper Functions --------------------- */

// Compute bounding box from an array of points (used only for non‐pose exports)
const getBoundingBox = (points) => {
  if (!points || points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

// Calculate polygon area using the shoelace formula
const calculatePolygonArea = (points) => {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length - 1; i++) {
    area += (points[i].x * points[i + 1].y - points[i + 1].x * points[i].y);
  }
  return Math.abs(area / 2);
};

// Load image dimensions from a URL (returns { width, height })
const loadImageDimension = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = url;
  });

/* ------------------- Export Format Generators ------------------- */

// Standard COCO export (without keypoints)
const generateCOCO = (annotations, filesList, dimensions, labelClasses) => {
  const images = filesList.map((file, index) => ({
    id: index + 1,
    file_name: file.originalname,
    width: dimensions[file.url]?.width || 0,
    height: dimensions[file.url]?.height || 0,
  }));

  const categories = labelClasses.map((lc, index) => ({
    id: index + 1,
    name: lc.name,
  }));

  const annotationsList = [];
  let annId = 1;
  filesList.forEach((file, imgIndex) => {
    const imgId = imgIndex + 1;
    const shapes = annotations[file.url] || [];
    shapes.forEach((shape) => {
      // Only include bbox and polygon annotations (not pose)
      if (shape.type === 'bbox') {
        annotationsList.push({
          id: annId++,
          image_id: imgId,
          category_id: categories.find(c => c.name === shape.label)?.id,
          bbox: [shape.x, shape.y, shape.width, shape.height],
          area: shape.width * shape.height,
          iscrowd: 0,
        });
      } else if (shape.type === 'polygon') {
        const segPoints = shape.points.flatMap(p => [p.x, p.y]);
        const bbox = getBoundingBox(shape.points);
        annotationsList.push({
          id: annId++,
          image_id: imgId,
          category_id: categories.find(c => c.name === shape.label)?.id,
          segmentation: [segPoints],
          area: calculatePolygonArea(shape.points),
          bbox: [bbox.x, bbox.y, bbox.width, bbox.height],
          iscrowd: 0,
        });
      }
    });
  });

  return {
    info: { description: 'Exported annotations in COCO format (no keypoints)' },
    images,
    annotations: annotationsList,
    categories,
  };
};

// Generate COCO keypoints export (only include annotations that explicitly have keypoints/pose)
const generateCOCOKeypoints = (annotations, filesList, dimensions, labelClasses) => {
  const images = filesList.map((file, index) => ({
    id: index + 1,
    file_name: file.originalname,
    width: dimensions[file.url]?.width || 0,
    height: dimensions[file.url]?.height || 0,
  }));

  const categories = labelClasses.map((lc, index) => ({
    id: index + 1,
    name: lc.name,
    // Note: COCO keypoints categories normally include a "keypoints" array and "skeleton"
  }));

  const annotationsList = [];
  let annId = 1;
  filesList.forEach((file, imgIndex) => {
    const imgId = imgIndex + 1;
    const shapes = annotations[file.url] || [];
    shapes.forEach((shape) => {
      // Only include annotations that explicitly have keypoint data
      let keypoints = null;
      if (shape.points && shape.points.length > 0 && shape.type === 'pose') {
        keypoints = shape.points;
      } else if (shape.keypoints && shape.keypoints.length > 0) {
        keypoints = shape.keypoints;
      }
      if (!keypoints) return;
      // Flatten keypoints: [x, y, v, x, y, v, ...] (absolute coordinates)
      const flattened = keypoints.flatMap(k => [k.x, k.y, (k.v !== undefined ? k.v : 2)]);
      const num_keypoints = keypoints.filter(k => (k.v !== undefined ? k.v > 0 : true)).length;
      const bbox = getBoundingBox(keypoints);
      annotationsList.push({
        id: annId++,
        image_id: imgId,
        category_id: categories.find(c => c.name === shape.label)?.id,
        bbox: [bbox.x, bbox.y, bbox.width, bbox.height],
        area: bbox.width * bbox.height,
        keypoints: flattened,
        num_keypoints: num_keypoints,
        iscrowd: 0,
      });
    });
  });

  return {
    info: { description: 'Exported annotations in COCO keypoints format' },
    images,
    annotations: annotationsList,
    categories,
  };
};

// Generate Pascal VOC XML files (one XML per image)
const generatePascalVOC = (annotations, filesList, dimensions) => {
  return filesList.map(file => {
    const shapes = annotations[file.url] || [];
    const xmlDoc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('annotation')
        .ele('folder').txt('images').up()
        .ele('filename').txt(file.originalname).up()
        .ele('size')
          .ele('width').txt((dimensions[file.url]?.width || 0).toString()).up()
          .ele('height').txt((dimensions[file.url]?.height || 0).toString()).up()
          .ele('depth').txt('3').up()
        .up();

    shapes.forEach(shape => {
      // For VOC, we include only bbox and polygon annotations.
      const object = xmlDoc.ele('object');
      object.ele('name').txt(shape.label).up();
      let bbox;
      if (shape.type === 'bbox') {
        bbox = { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
      } else {
        bbox = getBoundingBox(shape.points || [{ x: shape.x || 0, y: shape.y || 0 }]);
      }
      const bndbox = object.ele('bndbox');
      bndbox.ele('xmin').txt(bbox.x.toString()).up();
      bndbox.ele('ymin').txt(bbox.y.toString()).up();
      bndbox.ele('xmax').txt((bbox.x + bbox.width).toString()).up();
      bndbox.ele('ymax').txt((bbox.y + bbox.height).toString()).up();
      object.up();
    });

    return {
      name: file.originalname.replace(/\.[^/.]+$/, '') + '.xml',
      content: xmlDoc.end({ prettyPrint: true }),
    };
  });
};

// Generate YOLO bounding box format files (one .txt per image)
const generateYOLOBBox = (annotations, filesList, dimensions, labelClasses) => {
  const txtFiles = filesList.map(file => {
    const shapes = annotations[file.url] || [];
    const imgDim = dimensions[file.url] || { width: 1, height: 1 };
    const lines = shapes.map(shape => {
      let bbox;
      if (shape.type === 'bbox') {
        bbox = { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
      } else if (shape.type === 'polygon') {
        bbox = getBoundingBox(shape.points);
      } else {
        return null;
      }
      const cx = ((bbox.x + bbox.width / 2) / imgDim.width).toFixed(6);
      const cy = ((bbox.y + bbox.height / 2) / imgDim.height).toFixed(6);
      const w = (bbox.width / imgDim.width).toFixed(6);
      const h = (bbox.height / imgDim.height).toFixed(6);
      const classId = labelClasses.findIndex(lc => lc.name === shape.label);
      if (classId === -1) return null;
      return `${classId} ${cx} ${cy} ${w} ${h}`;
    }).filter(Boolean);
    return {
      name: file.originalname.replace(/\.[^/.]+$/, '') + '.txt',
      content: lines.join('\n'),
    };
  });
  return txtFiles;
};

// Generate YOLO segmentation format files (each line: class_id followed by polygon points normalized)
const generateYOLOSeg = (annotations, filesList, dimensions, labelClasses) => {
  const txtFiles = filesList.map(file => {
    const shapes = annotations[file.url] || [];
    const imgDim = dimensions[file.url] || { width: 1, height: 1 };
    const lines = shapes.map(shape => {
      const classId = labelClasses.findIndex(lc => lc.name === shape.label);
      if (classId === -1) return null;
      let points;
      if (shape.type === 'polygon' && shape.points && shape.points.length >= 3) {
        points = shape.points;
      } else if (shape.type === 'bbox') {
        // Convert bbox to 4-point polygon (clockwise)
        points = [
          { x: shape.x, y: shape.y },
          { x: shape.x + shape.width, y: shape.y },
          { x: shape.x + shape.width, y: shape.y + shape.height },
          { x: shape.x, y: shape.y + shape.height },
        ];
      } else {
        return null;
      }
      const normalized = points.flatMap(p => [
        (p.x / imgDim.width).toFixed(6),
        (p.y / imgDim.height).toFixed(6)
      ]);
      return `${classId} ${normalized.join(' ')}`;
    }).filter(Boolean);
    return {
      name: file.originalname.replace(/\.[^/.]+$/, '') + '.txt',
      content: lines.join('\n'),
    };
  });
  return txtFiles;
};

// Generate YOLO pose format files (only export keypoints, ignoring bbox/polygon annotations)
// Format: class_id followed by each keypoint as "x y v" (normalized)
// Only annotations with type "pose" or with an explicit keypoints array are included.
const generateYOLOPose = (annotations, filesList, dimensions, labelClasses) => {
  const txtFiles = filesList.map(file => {
    const shapes = annotations[file.url] || [];
    const imgDim = dimensions[file.url] || { width: 1, height: 1 };
    const lines = shapes.map(shape => {
      // Only include annotations that explicitly are meant for pose/keypoints.
      // We ignore shapes with type 'polygon' or 'bbox' even if they have a "points" array.
      if (shape.type !== 'pose' && !(shape.keypoints && shape.keypoints.length > 0)) return null;
      const keypoints = shape.points && shape.points.length > 0 ? shape.points : shape.keypoints;
      if (!keypoints) return null;
      const classId = labelClasses.findIndex(lc => lc.name === shape.label);
      if (classId === -1) return null;
      // Format each keypoint as "x y v" (normalized)
      const kptValues = keypoints.map(k => {
        const nx = (k.x / imgDim.width).toFixed(6);
        const ny = (k.y / imgDim.height).toFixed(6);
        const vis = (k.v !== undefined) ? k.v : 2;
        return `${nx} ${ny} ${vis}`;
      }).join(' ');
      return `${classId} ${kptValues}`;
    }).filter(Boolean);
    return {
      name: file.originalname.replace(/\.[^/.]+$/, '') + '.txt',
      content: lines.join('\n'),
    };
  });
  return txtFiles;
};

// Generate a unified JSON that includes all annotation types (bbox, segmentation, pose, etc.)
// For pose annotations, only include the "points" property if present.
const generateUnifiedJSON = (annotations, filesList, dimensions, labelClasses) => {
  const images = filesList.map(file => {
    const dims = dimensions[file.url] || { width: 0, height: 0 };
    const shapes = annotations[file.url] || [];
    const annots = shapes.map(shape => {
      const common = { label: shape.label, type: shape.type };
      if (shape.type === 'bbox') {
         return { ...common, bbox: [shape.x, shape.y, shape.width, shape.height], area: shape.width * shape.height };
      } else if (shape.type === 'polygon') {
         return { ...common, points: shape.points, area: calculatePolygonArea(shape.points) };
      } else if (shape.type === 'pose' || (shape.keypoints && shape.keypoints.length > 0)) {
         // Only include keypoints for pose; ignore if the shape is a polygon
         const keypoints = (shape.points && shape.points.length > 0) ? shape.points : shape.keypoints;
         return { ...common, points: keypoints };
      } else {
         return shape;
      }
    });
    return {
       file_name: file.originalname,
       width: dims.width,
       height: dims.height,
       annotations: annots
    };
  });
  return { images };
};

/* --------------------- Main Export Component --------------------- */

export default function DetectionExport({
  annotations,
  filesList,
  imageDimensions,
  localLabelClasses,
  triggerExportModal,
}) {
  const [showModal, setShowModal] = useState(false);
  // Options: 'coco', 'coco_keypoints', 'pascal', 'yolo_bbox', 'yolo_seg', 'yolo_pose', 'unified_json'
  const [selectedFormat, setSelectedFormat] = useState('coco');

  // Open export modal when triggerExportModal is true
  useEffect(() => {
    if (triggerExportModal) {
      setShowModal(true);
    }
  }, [triggerExportModal]);

  // Ensure every image has valid dimensions; if missing, load them.
  const loadDimensions = async () => {
    const dimensions = { ...imageDimensions };
    await Promise.all(filesList.map(async (file) => {
      if (!dimensions[file.url] || !dimensions[file.url].width || !dimensions[file.url].height) {
        try {
          const dims = await loadImageDimension(file.url);
          dimensions[file.url] = dims;
        } catch (error) {
          console.error(`Failed to load dimensions for ${file.url}:`, error);
          dimensions[file.url] = { width: 0, height: 0 };
        }
      }
    }));
    return dimensions;
  };

  const handleExport = async () => {
    if (!filesList.length || !Object.keys(annotations).length) {
      alert('No annotations or images to export.');
      setShowModal(false);
      return;
    }

    const dimensions = await loadDimensions();
    let exportFiles = [];
    if (selectedFormat === 'coco') {
      const cocoData = generateCOCO(annotations, filesList, dimensions, localLabelClasses);
      exportFiles = [{ name: 'annotations.json', content: JSON.stringify(cocoData, null, 2) }];
    } else if (selectedFormat === 'coco_keypoints') {
      const cocoKPData = generateCOCOKeypoints(annotations, filesList, dimensions, localLabelClasses);
      exportFiles = [{ name: 'annotations_keypoints.json', content: JSON.stringify(cocoKPData, null, 2) }];
    } else if (selectedFormat === 'pascal') {
      exportFiles = generatePascalVOC(annotations, filesList, dimensions);
    } else if (selectedFormat === 'yolo_bbox') {
      exportFiles = generateYOLOBBox(annotations, filesList, dimensions, localLabelClasses);
      const classesContent = localLabelClasses.map(lc => lc.name).join('\n');
      exportFiles.push({ name: 'classes.txt', content: classesContent });
    } else if (selectedFormat === 'yolo_seg') {
      exportFiles = generateYOLOSeg(annotations, filesList, dimensions, localLabelClasses);
      const classesContent = localLabelClasses.map(lc => lc.name).join('\n');
      exportFiles.push({ name: 'classes.txt', content: classesContent });
    } else if (selectedFormat === 'yolo_pose') {
      exportFiles = generateYOLOPose(annotations, filesList, dimensions, localLabelClasses);
      const classesContent = localLabelClasses.map(lc => lc.name).join('\n');
      exportFiles.push({ name: 'classes.txt', content: classesContent });
    } else if (selectedFormat === 'unified_json') {
      const unifiedData = generateUnifiedJSON(annotations, filesList, dimensions, localLabelClasses);
      exportFiles = [{ name: 'unified_annotations.json', content: JSON.stringify(unifiedData, null, 2) }];
    }

    const zip = new JSZip();
    exportFiles.forEach(file => {
      zip.file(file.name, file.content);
    });

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `annotations_${selectedFormat}.zip`);
    } catch (error) {
      console.error("Error generating ZIP:", error);
      alert("There was an error exporting the annotations.");
    }
    setShowModal(false);
  };

  return (
    <>
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Export Annotations</h3>
            <div className="format-selection">
              <label>
                <input
                  type="radio"
                  name="format"
                  value="coco"
                  checked={selectedFormat === 'coco'}
                  onChange={() => setSelectedFormat('coco')}
                />
                COCO (BBox/Segmentation without keypoints)
              </label>
              <label>
                <input
                  type="radio"
                  name="format"
                  value="coco_keypoints"
                  checked={selectedFormat === 'coco_keypoints'}
                  onChange={() => setSelectedFormat('coco_keypoints')}
                />
                COCO Keypoints
              </label>
              <label>
                <input
                  type="radio"
                  name="format"
                  value="pascal"
                  checked={selectedFormat === 'pascal'}
                  onChange={() => setSelectedFormat('pascal')}
                />
                Pascal VOC
              </label>
              <label>
                <input
                  type="radio"
                  name="format"
                  value="yolo_bbox"
                  checked={selectedFormat === 'yolo_bbox'}
                  onChange={() => setSelectedFormat('yolo_bbox')}
                />
                YOLO (Bounding Box)
              </label>
              <label>
                <input
                  type="radio"
                  name="format"
                  value="yolo_seg"
                  checked={selectedFormat === 'yolo_seg'}
                  onChange={() => setSelectedFormat('yolo_seg')}
                />
                YOLO (Segmentation)
              </label>
              <label>
                <input
                  type="radio"
                  name="format"
                  value="yolo_pose"
                  checked={selectedFormat === 'yolo_pose'}
                  onChange={() => setSelectedFormat('yolo_pose')}
                />
                YOLO (Pose – Only Keypoints)
              </label>
              <label>
                <input
                  type="radio"
                  name="format"
                  value="unified_json"
                  checked={selectedFormat === 'unified_json'}
                  onChange={() => setSelectedFormat('unified_json')}
                />
                Unified JSON (All)
              </label>
            </div>
            <div className="modal-footer">
              <button onClick={handleExport} className="primary">
                Export
              </button>
              <button onClick={() => setShowModal(false)} className="secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

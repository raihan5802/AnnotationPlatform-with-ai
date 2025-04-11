// src/pages/SegmentationExport.js
import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { create } from 'xmlbuilder2';
import './SegmentationExport.css';

/* --------------------- Helper Functions --------------------- */

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

const calculatePolygonArea = (points) => {
    if (!points || points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length - 1; i++) {
        area += (points[i].x * points[i + 1].y - points[i + 1].x * points[i].y);
    }
    return Math.abs(area / 2);
};

const loadImageDimension = (url) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = url;
    });

/* ------------------- Export Format Generators ------------------- */

// COCO segmentation export (using polygon segmentation)
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
        shapes.forEach(shape => {
            // For segmentation export, we include polygon annotations.
            if (shape.type === 'polygon' || shape.type === 'ellipse') {
                const segPoints = shape.points.flatMap(p => [p.x, p.y]);
                const bbox = getBoundingBox(shape.points);
                annotationsList.push({
                    id: annId++,
                    image_id: imgId,
                    category_id: labelClasses.findIndex(lc => lc.name === shape.label) + 1,
                    segmentation: [segPoints],
                    area: calculatePolygonArea(shape.points),
                    bbox: [bbox.x, bbox.y, bbox.width, bbox.height],
                    iscrowd: 0,
                });
            }
        });
    });
    return {
        info: { description: 'Segmentation annotations in COCO format' },
        images,
        annotations: annotationsList,
        categories,
    };
};

// COCO Keypoints are not supported here – we assume segmentation only.

// Pascal VOC segmentation export (XML per image)
// (For segmentation, we export polygon annotations as in detection.)
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
            if (shape.type === 'polygon' || shape.type === 'ellipse') {
                const object = xmlDoc.ele('object');
                object.ele('name').txt(shape.label).up();
                const bbox = getBoundingBox(shape.points);
                const bndbox = object.ele('bndbox');
                bndbox.ele('xmin').txt(bbox.x.toString()).up();
                bndbox.ele('ymin').txt(bbox.y.toString()).up();
                bndbox.ele('xmax').txt((bbox.x + bbox.width).toString()).up();
                bndbox.ele('ymax').txt((bbox.y + bbox.height).toString()).up();
                object.up();
            }
        });
        return {
            name: file.originalname.replace(/\.[^/.]+$/, '') + '.xml',
            content: xmlDoc.end({ prettyPrint: true }),
        };
    });
};

// YOLO segmentation export (each line: class_id followed by normalized polygon points)
const generateYOLOSeg = (annotations, filesList, dimensions, labelClasses) => {
    const txtFiles = filesList.map(file => {
        const shapes = annotations[file.url] || [];
        const imgDim = dimensions[file.url] || { width: 1, height: 1 };
        const lines = shapes.map(shape => {
            // Only include polygon (or ellipse-converted) annotations for segmentation.
            if (!(shape.type === 'polygon' || shape.type === 'ellipse')) return null;
            const classId = labelClasses.findIndex(lc => lc.name === shape.label);
            if (classId === -1) return null;
            const normalized = shape.points.flatMap(p => [
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

// Unified JSON export (all segmentation annotations as polygons)
const generateUnifiedJSON = (annotations, filesList, dimensions, labelClasses) => {
    const images = filesList.map(file => {
        const dims = dimensions[file.url] || { width: 0, height: 0 };
        const shapes = annotations[file.url] || [];
        const annots = shapes
            .filter(shape => shape.type === 'polygon' || shape.type === 'ellipse')
            .map(shape => ({
                label: shape.label,
                points: shape.points,
            }));
        return {
            file_name: file.originalname,
            width: dims.width,
            height: dims.height,
            annotations: annots,
        };
    });
    return { images };
};

/* --------------------- Main Export Component --------------------- */

export default function SegmentationExport({
    annotations,
    filesList,
    imageDimensions,
    localLabelClasses,
    triggerExportModal,
}) {
    const [showModal, setShowModal] = useState(false);
    // Options: 'coco', 'pascal', 'yolo_seg', 'unified_json'
    const [selectedFormat, setSelectedFormat] = useState('coco');

    useEffect(() => {
        if (triggerExportModal) setShowModal(true);
    }, [triggerExportModal]);

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
            // Not applicable for segmentation export; keypoints not supported here.
        } else if (selectedFormat === 'pascal') {
            exportFiles = generatePascalVOC(annotations, filesList, dimensions);
        } else if (selectedFormat === 'yolo_seg') {
            exportFiles = generateYOLOSeg(annotations, filesList, dimensions, localLabelClasses);
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
            saveAs(zipBlob, `segmentation_annotations_${selectedFormat}.zip`);
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
                        <h3>Export Segmentation Annotations</h3>
                        <div className="format-selection">
                            <label>
                                <input
                                    type="radio"
                                    name="format"
                                    value="coco"
                                    checked={selectedFormat === 'coco'}
                                    onChange={() => setSelectedFormat('coco')}
                                />
                                COCO (Segmentation)
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
                                    value="unified_json"
                                    checked={selectedFormat === 'unified_json'}
                                    onChange={() => setSelectedFormat('unified_json')}
                                />
                                Unified JSON (All)
                            </label>
                        </div>
                        <div className="modal-footer">
                            <button onClick={handleExport} className="primary">Export</button>
                            <button onClick={() => setShowModal(false)} className="secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

import React, { useState, useEffect, useRef } from 'react';

const PolygonPointAdjuster = ({
  annotation,
  index,
  onUpdate,
  onClose,
  stage, // Pass the stage reference to position the adjuster
  scale
}) => {
  // Store the original points so we can restore them
  const originalPointsRef = useRef([...annotation.points]);
  const [pointCount, setPointCount] = useState(annotation.points.length);
  const [previewCount, setPreviewCount] = useState(annotation.points.length);
  const [sliderActive, setSliderActive] = useState(false);
  const adjusterRef = useRef(null);

  // Set reasonable limits based on the original point count
  const minPoints = Math.max(3, Math.floor(originalPointsRef.current.length * 0.3));
  const maxPoints = Math.min(100, Math.ceil(originalPointsRef.current.length * 3));

  // Calculate position near the shape
  const calculatePosition = () => {
    // Find the center of the annotation
    let centerX = 0;
    let centerY = 0;

    annotation.points.forEach(pt => {
      centerX += pt.x;
      centerY += pt.y;
    });

    centerX /= annotation.points.length;
    centerY /= annotation.points.length;

    // Convert to stage coordinates
    const stageBox = stage?.container().getBoundingClientRect();
    if (!stageBox) return { left: '50%', top: '10px', transform: 'translateX(-50%)' };

    // Get the group position
    const annoGroup = stage?.findOne('#anno-group');
    if (!annoGroup) return { left: '50%', top: '10px', transform: 'translateX(-50%)' };

    const groupX = annoGroup.x();
    const groupY = annoGroup.y();

    // Convert to absolute position
    const absX = (centerX * scale) + (groupX * scale) + stageBox.left;
    const absY = (centerY * scale) + (groupY * scale) + stageBox.top;

    // Adjust to keep in view
    const panelWidth = 320;
    const panelHeight = 220;

    let left = absX - (panelWidth / 2);
    let top = absY - panelHeight - 20; // 20px offset above the shape

    // Keep in window bounds
    if (left < 10) left = 10;
    if (left + panelWidth > window.innerWidth - 10) left = window.innerWidth - panelWidth - 10;
    if (top < 10) top = absY + 20; // Position below if not enough space above
    if (top + panelHeight > window.innerHeight - 10) top = window.innerHeight - panelHeight - 10;

    return {
      left: `${left}px`,
      top: `${top}px`,
      transform: 'none'
    };
  };

  const position = calculatePosition();

  // Function to increase or decrease points in the polygon
  const adjustPoints = (newPointCount) => {
    if (!annotation || !annotation.points || annotation.points.length < 3) return;

    const originalPoints = originalPointsRef.current;

    if (newPointCount > originalPoints.length) {
      // Add points by subdividing existing segments
      const addedPointsNeeded = newPointCount - originalPoints.length;
      let newPoints = [...originalPoints];

      // We'll distribute new points along segments based on their length
      // First, calculate the total perimeter
      let segments = [];
      let totalLength = 0;

      for (let i = 0; i < originalPoints.length; i++) {
        const p1 = originalPoints[i];
        const p2 = originalPoints[(i + 1) % originalPoints.length];
        const length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        segments.push({ index: i, length, start: p1, end: p2 });
        totalLength += length;
      }

      // Sort segments by length (longest first)
      segments.sort((a, b) => b.length - a.length);

      // Assign points to segments proportionally to their length
      let pointsToAdd = addedPointsNeeded;
      let pointsAssigned = 0;

      // Create a deep copy of segments to avoid modifying the original
      const segmentsCopy = segments.map(seg => ({ ...seg }));

      for (let i = 0; i < segmentsCopy.length && pointsToAdd > 0; i++) {
        const segment = segmentsCopy[i];
        // Calculate how many points this segment should get
        const segmentRatio = segment.length / totalLength;
        let pointsForSegment = Math.floor(addedPointsNeeded * segmentRatio);

        if (pointsForSegment === 0 && i < addedPointsNeeded) {
          pointsForSegment = 1;
        }

        if (pointsAssigned + pointsForSegment > addedPointsNeeded) {
          pointsForSegment = addedPointsNeeded - pointsAssigned;
        }

        if (pointsForSegment > 0) {
          const pointsToInsert = [];

          for (let j = 1; j <= pointsForSegment; j++) {
            const ratio = j / (pointsForSegment + 1);
            const newPoint = {
              x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
              y: segment.start.y + (segment.end.y - segment.start.y) * ratio
            };

            pointsToInsert.push({
              point: newPoint,
              insertAt: segment.index + j
            });
          }

          // Sort points to insert from back to front to maintain indices
          pointsToInsert.sort((a, b) => b.insertAt - a.insertAt);

          for (const { point, insertAt } of pointsToInsert) {
            newPoints.splice(insertAt, 0, point);

            // Update remaining segment indices
            for (let k = 0; k < segmentsCopy.length; k++) {
              if (segmentsCopy[k].index >= insertAt) {
                segmentsCopy[k].index++;
              }
            }
          }

          pointsAssigned += pointsForSegment;
          pointsToAdd -= pointsForSegment;
        }
      }

      setPointCount(newPoints.length);
      onUpdate(index, { points: newPoints });

    } else if (newPointCount < originalPoints.length) {
      // Remove points based on significance
      const reducePoints = (points, maxPoints) => {
        if (points.length <= maxPoints) return points;

        // Calculate point significance based on angle and distances
        const significance = [];
        for (let i = 0; i < points.length; i++) {
          const prev = points[(i - 1 + points.length) % points.length];
          const curr = points[i];
          const next = points[(i + 1) % points.length];

          // Calculate vectors
          const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
          const v2 = { x: next.x - curr.x, y: next.y - curr.y };

          // Calculate lengths
          const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
          const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

          // Skip if vectors are too small
          if (len1 < 0.001 || len2 < 0.001) {
            significance.push({ index: i, value: 0, distance: len1 + len2 });
            continue;
          }

          // Normalize vectors
          const nv1 = { x: v1.x / len1, y: v1.y / len1 };
          const nv2 = { x: v2.x / len2, y: v2.y / len2 };

          // Calculate dot product
          const dotProduct = nv1.x * nv2.x + nv1.y * nv2.y;

          // Calculate angle (lower is more significant)
          const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));

          // Points along straight lines are less significant
          significance.push({ index: i, value: angle, distance: len1 + len2 });
        }

        // Sort by significance (least significant first)
        significance.sort((a, b) => a.value - b.value);

        // Remove least significant points
        const pointsToRemove = Math.min(points.length - maxPoints, points.length - 3);
        if (pointsToRemove <= 0) return points;

        const indicesToRemove = significance.slice(0, pointsToRemove)
          .map(s => s.index)
          .sort((a, b) => b - a); // Sort in descending order to remove from end first

        // Create a new array without the removed points
        let newPoints = [...points];
        for (const index of indicesToRemove) {
          newPoints.splice(index, 1);
        }

        return newPoints;
      };

      const newPoints = reducePoints(originalPoints, newPointCount);
      setPointCount(newPoints.length);
      onUpdate(index, { points: newPoints });
    } else if (newPointCount === originalPointsRef.current.length) {
      // Restore original points
      onUpdate(index, { points: [...originalPointsRef.current] });
    }
  };

  // Preview point count as the slider changes
  const handleSliderChange = (e) => {
    const newCount = parseInt(e.target.value);
    setPreviewCount(newCount);

    // If dragging is active, update the points immediately
    if (sliderActive) {
      setPointCount(newCount);
      adjustPoints(newCount);
    }
  };

  // Apply point count changes when slider interaction begins
  const handleSliderStart = () => {
    setSliderActive(true);
  };

  // Apply point count changes when slider interaction ends
  const handleSliderEnd = () => {
    setSliderActive(false);
    if (previewCount !== pointCount) {
      setPointCount(previewCount);
      adjustPoints(previewCount);
    }
  };

  // Restore original points
  const handleRestoreOriginal = () => {
    setPointCount(originalPointsRef.current.length);
    setPreviewCount(originalPointsRef.current.length);
    onUpdate(index, { points: [...originalPointsRef.current] });
  };

  // Is the current point count original?
  const isOriginal = pointCount === originalPointsRef.current.length;

  return (
    <div
      ref={adjusterRef}
      className="polygon-point-adjuster"
      style={{
        position: 'absolute',
        left: position.left,
        top: position.top,
        transform: position.transform,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        borderRadius: '8px',
        padding: '15px',
        zIndex: 1000,
        color: 'white',
        width: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        paddingBottom: '10px'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>Adjust Polygon Points</h3>
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '0 5px',
            fontWeight: 'bold'
          }}
        >
          ×
        </button>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px'
      }}>
        <span>
          Current points: <span style={{ fontWeight: 'bold' }}>{pointCount}</span>
        </span>
        <span style={{
          background: isOriginal ? '#4CAF50' : '#555',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {isOriginal ? 'Original' : 'Modified'}
        </span>
      </div>

      <div>
        <div style={{ marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px' }}>Point Count:</span>
          <span style={{ fontSize: '13px', opacity: 0.7 }}>{previewCount}</span>
        </div>
        <input
          type="range"
          min={minPoints}
          max={maxPoints}
          value={previewCount}
          onChange={handleSliderChange}
          onMouseDown={handleSliderStart}
          onTouchStart={handleSliderStart}
          onMouseUp={handleSliderEnd}
          onTouchEnd={handleSliderEnd}
          style={{
            width: '100%',
            height: '8px',
            appearance: 'none',
            background: 'linear-gradient(to right, #F44336, #FFC107, #4CAF50)',
            outline: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          opacity: 0.7,
          marginTop: '5px'
        }}>
          <span>Fewer ({minPoints})</span>
          <span>Original ({originalPointsRef.current.length})</span>
          <span>More ({maxPoints})</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleRestoreOriginal}
          style={{
            flex: 1,
            backgroundColor: isOriginal ? '#555' : '#FFC107',
            border: 'none',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            opacity: isOriginal ? 0.7 : 1
          }}
          disabled={isOriginal}
        >
          Restore Original
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            backgroundColor: '#555',
            border: 'none',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PolygonPointAdjuster;
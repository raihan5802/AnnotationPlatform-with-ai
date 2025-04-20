/**
 * Utility functions for geometry operations
 */

/**
 * Convert an array of points to a flat array for Konva
 * @param {Array} pts - Array of points with x, y properties
 * @returns {Array} - Flat array [x1, y1, x2, y2, ...]
 */
export function flattenPoints(pts) {
    return pts.flatMap((p) => [p.x, p.y]);
  }
  
  /**
   * Generate an SVG path for a polygon with holes
   * @param {Array} outer - Array of points for the outer shape
   * @param {Array} holes - Array of arrays of points for any holes
   * @returns {String} - SVG path string
   */
  export function polygonToPath(outer, holes) {
    let path = 'M ' + outer[0].x + ' ' + outer[0].y + ' ';
    for (let i = 1; i < outer.length; i++) {
      path += 'L ' + outer[i].x + ' ' + outer[i].y + ' ';
    }
    path += 'Z ';
    
    if (holes && holes.length > 0) {
      holes.forEach((hole) => {
        if (hole.length > 0) {
          path += 'M ' + hole[0].x + ' ' + hole[0].y + ' ';
          for (let i = 1; i < hole.length; i++) {
            path += 'L ' + hole[i].x + ' ' + hole[i].y + ' ';
          }
          path += 'Z ';
        }
      });
    }
    
    return path;
  }
  
  /**
   * Calculate distance between two points
   * @param {Object} p1 - First point with x, y properties
   * @param {Object} p2 - Second point with x, y properties
   * @returns {Number} - Distance
   */
  export function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }
  
  /**
   * Reduce the number of points in a shape based on minimum distance
   * @param {Array} points - Array of points to reduce
   * @param {Number} threshold - Minimum distance between points
   * @returns {Array} - Reduced array of points
   */
  export function reducePoints(points, threshold) {
    if (points.length <= 3) return points;
    
    const result = [points[0]]; // Always keep the first point
    
    for (let i = 1; i < points.length; i++) {
      const prevPoint = result[result.length - 1];
      const currentPoint = points[i];
      
      // Only add point if it's far enough from the previous one
      if (getDistance(prevPoint, currentPoint) >= threshold) {
        result.push(currentPoint);
      }
    }
    
    // Ensure we have at least 3 points for polygon
    if (result.length < 3) {
      return points.filter((_, index) => index % Math.floor(points.length / 3) === 0);
    }
    
    return result;
  }
  
  /**
   * Compute a bounding box from polygon points
   * @param {Array} points - Array of points with x, y properties
   * @returns {Object} - Bounding box {x1, y1, x2, y2}
   */
  export function computeBoundingBox(points) {
    if (!points || points.length === 0) return null;
    
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    points.forEach(pt => {
      minX = Math.min(minX, pt.x);
      minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x);
      maxY = Math.max(maxY, pt.y);
    });
    
    return { x1: minX, y1: minY, x2: maxX, y2: maxY };
  }
  
  /**
   * Calculate the area of a polygon
   * @param {Array} points - Array of points with x, y properties
   * @returns {Number} - Area of polygon
   */
  export function calculatePolygonArea(points) {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2);
  }
  
  /**
   * Shade a hex color by a given amount
   * @param {String} col - Hex color string
   * @param {Number} amt - Amount to shade (-255 to 255)
   * @returns {String} - Shaded hex color
   */
  export function shadeColor(col, amt) {
    let usePound = false;
    let color = col;
    
    if (color[0] === '#') {
      color = color.slice(1);
      usePound = true;
    }
    
    let R = parseInt(color.substring(0, 2), 16);
    let G = parseInt(color.substring(2, 4), 16);
    let B = parseInt(color.substring(4, 6), 16);
  
    R = Math.min(255, Math.max(0, R + amt));
    G = Math.min(255, Math.max(0, G + amt));
    B = Math.min(255, Math.max(0, B + amt));
  
    const RR = R.toString(16).padStart(2, '0');
    const GG = G.toString(16).padStart(2, '0');
    const BB = B.toString(16).padStart(2, '0');
  
    return (usePound ? '#' : '') + RR + GG + BB;
  }
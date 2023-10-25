import React, { useEffect, useRef, FC, useState, useCallback } from 'react';

import {
  BaseEdge,
  EdgeProps,
  getBezierPath,
  getSmoothStepPath,
  useReactFlow,
  EdgeText,
  useStore,
  ReactFlowState,
} from 'reactflow';

const DEG = 180 / Math.PI;

interface Coordinates {
  x: number;
  y: number;
}

enum OffsetDirection {
  Right,
  Center,
  Left,
}

function getRotation(p1: Coordinates, p2: Coordinates) {
  var dx = p2.x - p1.x;
  var dy = p2.y - p1.y;
  return Math.atan2(dy, dx);
}

function closestPoint(pathNode: SVGPathElement, pathLength: number, point: Coordinates) {
  function distance2(p: Coordinates) {
    var dx = p.x - point.x,
      dy = p.y - point.y;
    return dx * dx + dy * dy;
  }

  let precision = 8;
  let best: DOMPoint = new DOMPoint();
  let bestLength = 0;
  let bestDistance = Infinity;

  for (let scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
    scan = pathNode.getPointAtLength(scanLength);
    scanDistance = distance2(scan);
    if (scanDistance < bestDistance) {
      (best = scan), (bestLength = scanLength), (bestDistance = scanDistance);
    }
  }

  precision /= 2;
  while (precision > 0.5) {
    let before, after, beforeLength, afterLength, beforeDistance, afterDistance;
    if (
      (beforeLength = bestLength - precision) >= 0 &&
      (beforeDistance = distance2((before = pathNode.getPointAtLength(beforeLength)))) < bestDistance
    ) {
      (best = before), (bestLength = beforeLength), (bestDistance = beforeDistance);
    } else if (
      (afterLength = bestLength + precision) <= pathLength &&
      (afterDistance = distance2((after = pathNode.getPointAtLength(afterLength)))) < bestDistance
    ) {
      (best = after), (bestLength = afterLength), (bestDistance = afterDistance);
    } else {
      precision /= 2;
    }
  }

  const len2 = bestLength + (bestLength === pathLength ? -0.1 : 0.1);
  const rotation = getRotation(best, pathNode.getPointAtLength(len2));

  return {
    point: best,
    rotation: rotation * DEG,
    distance: Math.sqrt(bestDistance),
  };
}

function distance(point1: Coordinates, point2: Coordinates): number {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getPointTAlongPath(path: SVGPathElement, point: Coordinates, tolerance: number = 0.01): number {
  let lower = 0;
  const pathLength = path.getTotalLength();
  let upper = path.getTotalLength();
  let closestT = (upper + lower) / 2;

  while (upper - lower > tolerance) {
    const midpoint = (upper + lower) / 2;
    const start = path.getPointAtLength(lower);
    const middle = path.getPointAtLength(midpoint);
    const end = path.getPointAtLength(upper);

    const d1 = distance(start, point);
    const d2 = distance(middle, point);
    const d3 = distance(end, point);

    // Determine which segment to narrow down to
    if (d1 < d2 && d1 < d3) {
      upper = midpoint;
    } else if (d2 < d1 && d2 < d3) {
      lower = lower + (midpoint - lower) / 2;
      upper = upper - (upper - midpoint) / 2;
    } else {
      lower = midpoint;
    }

    closestT = (upper + lower) / 2;
  }

  return closestT / pathLength;
}

function getPointFromT(path: SVGPathElement, t: number) {
  const totalLength = path.getTotalLength();
  const lengthFromStart = t * totalLength;

  const point = path.getPointAtLength(lengthFromStart);

  return point;
}

function getCoordinatesFromPath(pathElement: SVGPathElement) {
  const pathData = pathElement.getAttribute('d');

  if (!pathData) {
    throw new Error('Path element has no "d" attribute');
  }

  const [M, C] = pathData.split(' ').filter((cmd) => ['M', 'C'].includes(cmd));

  const numbers = pathData.match(/-?[\d.]+/g)?.map(Number) as number[];

  const P0 = { x: numbers[0], y: numbers[1] };
  const P1 = { x: numbers[2], y: numbers[3] };
  const P2 = { x: numbers[4], y: numbers[5] };
  const P3 = { x: numbers[6], y: numbers[7] };

  return [P0, P1, P2, P3];
}

function getFirstSiblingWithClass(element: any, className: string) {
  let sibling = element.nextElementSibling;

  while (sibling) {
    if (sibling.classList.contains(className)) {
      return sibling;
    }
    sibling = sibling.nextElementSibling;
  }

  return null;
}

function getTextOffset(pathElement: SVGPathElement, t: number, offsetDirection: OffsetDirection) {
  const textBox = getFirstSiblingWithClass(pathElement, 'react-flow__edge-textwrapper');
  if (!textBox || offsetDirection === OffsetDirection.Center) {
    return { xOffset: 0, yOffset: 0 };
  }
  const [P0, P1, P2, P3] = getCoordinatesFromPath(pathElement);
  console.log(t);
  const dx =
    3 * Math.pow(1 - t, 2) * (P1.x - P0.x) + 6 * (1 - t) * t * (P2.x - P1.x) + 3 * Math.pow(t, 2) * (P3.x - P2.x);
  const dy =
    3 * Math.pow(1 - t, 2) * (P1.y - P0.y) + 6 * (1 - t) * t * (P2.y - P1.y) + 3 * Math.pow(t, 2) * (P3.y - P2.y);

  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  let xOffset = 0,
    yOffset = 0;

  const yOffsetValue = 20;
  const xOffsetValue = textBox.getBoundingClientRect().width / 2 + 15;
  // console.log(angle);
  if (angle > -10 && angle <= 10) {
    yOffset = -yOffsetValue;
  }

  if (angle > 10 && angle <= 80) {
    xOffset = xOffsetValue;
    yOffset = -yOffsetValue;
  }

  if (angle > 80 && angle <= 100) {
    xOffset = xOffsetValue;
  }

  if (angle > 100 && angle <= 170) {
    xOffset = xOffsetValue;
    yOffset = yOffsetValue;
  }

  if (angle > 170 || angle <= -170) {
    yOffset = yOffsetValue;
  }

  if (angle > -170 && angle <= -100) {
    xOffset = -xOffsetValue;
    yOffset = yOffsetValue;
  }

  if (angle > -100 && angle <= -80) {
    xOffset = -xOffsetValue;
  }

  if (angle > -80 && angle <= -10) {
    xOffset = -xOffsetValue;
    yOffset = -yOffsetValue;
  }

  if (offsetDirection === OffsetDirection.Left) {
    xOffset = -xOffset;
    yOffset = -yOffset;
  }

  return { xOffset, yOffset };
}

function vectorBetweenPoints(p1: Coordinates, p2: Coordinates) {
  const x = p2.x - p1.x;
  const y = p2.y - p1.y;
  return { x, y };
}

function vectorToCompassBearing(vector: Coordinates) {
  const angleRadians = Math.atan2(vector.y, vector.x);
  const angleDegrees = angleRadians * (180 / Math.PI);

  // Convert the angle to a compass bearing
  const bearing = (450 - angleDegrees) % 360;

  return bearing;
}

const calculateDirection = (path: SVGPathElement, point: Coordinates, clientPoint: Coordinates, distance: number) => {
  const vector = vectorBetweenPoints(point, clientPoint);
  const bearing = vectorToCompassBearing(vector);

  const startPoint = path.getPointAtLength(0);
  const endPoint = path.getPointAtLength(path.getTotalLength());

  const sourceOverTarget = startPoint.y < endPoint.y;

  let direction = OffsetDirection.Center;

  if (bearing > 0 && bearing < 180 && distance > 20) {
    direction = sourceOverTarget ? OffsetDirection.Right : OffsetDirection.Left;
  }

  if (bearing > 180 && distance > 20) {
    direction = sourceOverTarget ? OffsetDirection.Left : OffsetDirection.Right;
  }

  return direction;
};

const CustomEdge: FC<EdgeProps> = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  const dragRef = useRef<SVGGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const [edgePath, centerX, centerY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [circlePos, setCirclePos] = useState({ x: centerX, y: centerY });
  const [labelPos, setLabelPos] = useState({ x: centerX, y: centerY });
  const [offsetDirection, setOffsetDirection] = useState<OffsetDirection>(OffsetDirection.Right);

  const [t, setT] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const path = pathRef.current as SVGPathElement;
    const { xOffset, yOffset } = getTextOffset(path, t, offsetDirection);

    const { x, y } = getPointFromT(path, t);
    setCirclePos({ x, y });
    setLabelPos({ x: x + xOffset, y: y + yOffset });
  }, [edgePath]);

  useEffect(() => {
    const { xOffset, yOffset } = getTextOffset(pathRef.current as SVGPathElement, t, offsetDirection);
    setLabelPos({ x: circlePos.x + xOffset, y: circlePos.y + yOffset });
  }, [t]);

  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    const drag = dragRef.current;
    const path = pathRef.current as SVGPathElement;

    function handleMouseDown() {
      setIsDragging(true);
    }

    function handleMouseMove(event: MouseEvent) {
      if (!isDragging) return;
      const clientPoint = { x: event.clientX, y: event.clientY - 40 };
      const projected = reactFlowInstance.project(clientPoint);
      const { point, distance } = closestPoint(path, path.getTotalLength(), projected);
      const direction = calculateDirection(path, point, projected, distance);
      setOffsetDirection(direction);
      const { xOffset, yOffset } = getTextOffset(path, t, direction);

      const startPoint = path.getPointAtLength(0);
      const endPoint = path.getPointAtLength(path.getTotalLength());

      point.y = Math.max(startPoint.y, Math.min(point.y, endPoint.y));

      const x = point.x + xOffset;
      const y = point.y + yOffset;

      setLabelPos({ x, y });
      setCirclePos(point);
    }

    function handleMouseUp() {
      setIsDragging(false);
      const innerT = getPointTAlongPath(path, circlePos);
      setT(innerT);
    }

    if (drag) {
      drag.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (drag) {
        drag.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [isDragging, pathRef, dragRef, circlePos, reactFlowInstance]);

  return (
    <>
      <path id={id} ref={pathRef} d={edgePath} fill="none" className="react-flow__edge-path" />
      <circle cx={circlePos.x} cy={circlePos.y} r={2} fill="black" />
      <EdgeText ref={dragRef} x={labelPos.x} y={labelPos.y} label="hejmeddig" />
    </>
  );
};

export default CustomEdge;

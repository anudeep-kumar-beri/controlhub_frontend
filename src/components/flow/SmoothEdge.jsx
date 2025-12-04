import React from 'react';
import { getSmoothStepPath } from 'reactflow';

function SmoothEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  labelStyle,
  labelShowBg,
  labelBgStyle,
}) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {label && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          {labelShowBg && (
            <rect
              x={-10}
              y={-10}
              width={20}
              height={20}
              className="react-flow__edge-label-bg"
              style={labelBgStyle}
            />
          )}
          <text
            className="react-flow__edge-label"
            y={5}
            style={labelStyle}
          >
            {label}
          </text>
        </g>
      )}
    </>
  );
}

export default React.memo(SmoothEdge);

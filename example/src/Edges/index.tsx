import React, { useState, MouseEvent } from 'react';

import ReactFlow, {
  removeElements,
  addEdge,
  MiniMap,
  Controls,
  Background,
  OnLoadParams,
  FlowElement,
  EdgeTypesType,
  Elements,
  Connection,
  Edge,
  ArrowHeadType,
  Node,
  Position,
  ConnectionMode
} from 'react-flow-renderer';

import CustomEdge from './CustomEdge';
import CustomNode from './CustomNode';
import CustomEdge2 from './CustomEdge2';
import CustomEdge3 from './CustomEdge3';

const onLoad = (reactFlowInstance: OnLoadParams) => reactFlowInstance.fitView();
const onNodeDragStop = (_: MouseEvent, node: Node) => console.log('drag stop', node);
const onElementClick = (_: MouseEvent, element: FlowElement) => console.log('click', element);


const sourceHandle = Position.Top
const targetHandle = Position.Bottom
const initialElements: Elements = [
  { id: '1', type: 'custom', data: { label: 'Input 1' }, position: { x: 250, y: 0 } },
  {type: 'custom', id: '2', data: { label: 'Node 2' }, position: { x: 150, y: 100 } },
  
  {id: 'e1-2', source: '1', target: '1', targetHandle, sourceHandle, arrowHeadType: ArrowHeadType.ArrowClosed, label: 'bezier edge (default)', className: 'normal-edge', type: 'custom3',   },
];

const edgeTypes: EdgeTypesType = {
  custom: CustomEdge,
  custom2: CustomEdge2,
  custom3: CustomEdge3
};

const EdgesFlow = () => {
  const [elements, setElements] = useState<Elements>(initialElements);

  const onElementsRemove = (elementsToRemove: Elements) => setElements((els) => removeElements(elementsToRemove, els));
  const onConnect = (params: Connection | Edge) => setElements((els) => addEdge(params, els));

  return (
    <ReactFlow
      elements={elements}
      onElementClick={onElementClick}
      onElementsRemove={onElementsRemove}
      onConnect={onConnect}
      onNodeDragStop={onNodeDragStop}
      onLoad={onLoad}
      snapToGrid={true}
      connectionMode={ConnectionMode.Loose}
      edgeTypes={edgeTypes}
      nodeTypes={{custom: CustomNode}}
    >
      <MiniMap />
      <Controls />
      <Background />
    </ReactFlow>
  );
};

export default EdgesFlow;

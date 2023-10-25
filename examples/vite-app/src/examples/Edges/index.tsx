import { MouseEvent, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  EdgeTypes,
  MarkerType,
  Node,
  useEdgesState,
  useNodesState,
} from 'reactflow';

import CustomEdge from './CustomEdge';
import CustomEdge2 from './CustomEdge2';

const initialNodes: Node[] = [
  { id: '5', data: { label: 'Node 5' }, position: { x: 250, y: 400 } },

  {
    id: '9',
    type: 'output',
    data: { label: 'Output 9' },
    position: { x: 250, y: 700 },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e5-9',
    source: '5',
    target: '9',
    type: 'custom2',
    data: { text: 'custom edge 2' },
  },
];

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
  custom2: CustomEdge2,
};

const EdgesFlow = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      edgeTypes={edgeTypes}
    >
      <Controls />
      <Background />
    </ReactFlow>
  );
};

export default EdgesFlow;

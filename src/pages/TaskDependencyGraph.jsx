import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import ReactFlow, { 
  Background, 
  Controls,
  MiniMap
} from 'react-flow-renderer';

const nodeTypes = {
  todo: '#gray',
  in_progress: '#blue',
  review: '#yellow',
  done: '#green'
};

export default function TaskDependencyGraph() {
  const { projectId } = useParams();
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGraph();
  }, [projectId]);

  const loadGraph = async () => {
    try {
      setLoading(true);
      const result = await invokeBeckendFunction('getTaskDependencyGraph', {
        project_id: projectId
      });
      
      // Transform the graph data for ReactFlow
      const elements = [
        ...result.nodes.map(node => ({
          id: node.id,
          data: { 
            label: node.label,
            status: node.status,
            priority: node.priority
          },
          position: { x: 0, y: 0 }, // You might want to implement proper layout
          style: {
            background: nodeTypes[node.status],
            border: '1px solid #ccc',
            padding: 10,
            borderRadius: 5
          }
        })),
        ...result.edges.map(edge => ({
          id: `e${edge.from}-${edge.to}`,
          source: edge.from,
          target: edge.to,
          label: edge.type,
          animated: edge.type === 'blocks',
          style: { stroke: edge.type === 'blocks' ? '#ff0000' : '#000000' }
        }))
      ];

      setGraph(elements);
    } catch (error) {
      console.error('Error loading dependency graph:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="h-[800px]">
      <ReactFlow
        elements={graph}
        nodesDraggable
        nodesConnectable={false}
        defaultZoom={1.5}
        minZoom={0.2}
        maxZoom={4}
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeColor={node => nodeTypes[node.data.status]}
          nodeStrokeWidth={3}
        />
      </ReactFlow>
    </Card>
  );
}
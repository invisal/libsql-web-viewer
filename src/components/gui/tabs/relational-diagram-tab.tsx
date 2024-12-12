import { DatabaseSchemaNode } from "@/components/database-schema-node";
import { useSchema } from "@/context/schema-provider";
import { DatabaseSchemas } from "@/drivers/base-driver";
import {
  Background,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useState } from "react";
import { Toolbar } from "../toolbar";
import { Button } from "@/components/ui/button";
import { LucideRefreshCcw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import SchemaNameSelect from "../schema-editor/schema-name-select";
import Dagre from "@dagrejs/dagre";
import {
  AlignCenterHorizontalSimple,
  AlignCenterVerticalSimple,
} from "@phosphor-icons/react";
import { DownloadImageDiagram } from "../export/download-image-diagram";
import { DevTools } from "@/components/devtools";

const NODE_MARGIN = 50;
const MAX_NODE_WIDTH = 300;

function getLayoutElements(
  nodes: Node[],
  edges: Edge[],
  options: Dagre.GraphLabel
) {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph(options);

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) =>
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
    })
  );

  Dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id);
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      const x = position.x - (node.measured?.width ?? 0) / 2;
      const y = position.y - (node.measured?.height ?? 0) / 2;
      return { ...node, position: { x, y } };
    }),
    edges,
  };
}

function mapSchema(
  schema: DatabaseSchemas,
  selectedSchema: string,
  rankdir?: string
): { initialNodes: Node[]; initialEdges: Edge[] } {
  const initialEdges: Edge[] = [];

  // Keep name of all table that has relationship
  const tableNameWithRelationship = new Set<string>();
  const foreignKeyList = new Set<string>();

  for (const item of schema[selectedSchema]) {
    if (item.type !== "table") continue;

    // Get the relationship via column constraint
    for (const column of item.tableSchema?.columns || []) {
      if (column.constraint && column.constraint.foreignKey) {
        tableNameWithRelationship.add(item.name);
        tableNameWithRelationship.add(
          column.constraint.foreignKey.foreignTableName || ""
        );

        foreignKeyList.add(`${item.name}.${column.name}`);

        initialEdges.push({
          type: "smoothstep",
          markerStart: {
            type: MarkerType.Arrow,
          },
          id: `${item.name}-${column.constraint.foreignKey.foreignTableName}`,
          source: item.name,
          target: column.constraint.foreignKey.foreignTableName || "",
          sourceHandle: column.name,
          targetHandle: column.constraint.foreignKey.foreignColumns
            ? column.constraint.foreignKey.foreignColumns[0]
            : "",
          animated: true,
        });
      }
    }

    // Get the relationship via table constraint
    for (const constraint of item.tableSchema?.constraints || []) {
      if (
        constraint.foreignKey &&
        constraint.foreignKey.foreignTableName !== item.name &&
        (constraint.foreignKey.foreignColumns ?? []).length === 1
      ) {
        tableNameWithRelationship.add(item.name);
        tableNameWithRelationship.add(
          constraint.foreignKey.foreignTableName || ""
        );

        const columnName = constraint.foreignKey.columns
          ? constraint.foreignKey.columns[0]
          : "";

        foreignKeyList.add(`${item.name}.${columnName}`);

        initialEdges.push({
          type: "smoothstep",
          markerStart: {
            type: MarkerType.Arrow,
          },
          id: `${item.name}-${constraint.foreignKey.foreignTableName}`,
          source: item.name,
          target: constraint.foreignKey.foreignTableName || "",
          sourceHandle: columnName,
          targetHandle: constraint.foreignKey.foreignColumns
            ? constraint.foreignKey.foreignColumns[0]
            : "",
          animated: true,
        });
      }
    }
  }

  // Split the schema into without relationship and with relationship
  const schemaWithRelationship = schema[selectedSchema].filter((x) => {
    if (x.type !== "table") return false;
    return tableNameWithRelationship.has(x.name);
  });

  const schemaWithoutRelationship = schema[selectedSchema].filter((x) => {
    if (x.type !== "table") return false;
    return !tableNameWithRelationship.has(x.name);
  });

  const relationshipNodes = schemaWithRelationship.map((item) => {
    return {
      id: String(item.name),
      type: "databaseSchema",
      position: {
        x: 0,
        y: 0,
      },
      measured: {
        width: 300,
        height: Math.min(20, item.tableSchema?.columns.length || 0) * 32 + 64,
      },
      data: {
        label: item.name,
        schema: item.tableSchema?.columns.map((column) => {
          return {
            title: column.name,
            type: column.type,
            pk: !!column.pk,
            fk: foreignKeyList.has(`${item.name}.${column.name}`),
            unique: !!column.constraint?.unique,
          };
        }),
      },
    };
  });

  // Rearrange the nodes with relationship
  const layoutRelationship = getLayoutElements(
    relationshipNodes,
    initialEdges,
    {
      rankdir: rankdir ? rankdir : "LR",
      marginx: NODE_MARGIN,
      marginy: NODE_MARGIN,
    }
  );

  // Rearrange the nodes with relationship
  // We need to find the position
  const relationshipRightPosition =
    Math.max(...layoutRelationship.nodes.map((x) => x.position.x)) +
    NODE_MARGIN +
    MAX_NODE_WIDTH;

  const relationshipTopPosition = Math.min(
    ...layoutRelationship.nodes.map((x) => x.position.y)
  );

  // Calculate estimate area of the nodes without relationship
  const area =
    schemaWithoutRelationship.reduce(
      (a, b) =>
        (a =
          a +
          Math.min(20, b.tableSchema?.columns.length || 0) * 32 +
          64 +
          NODE_MARGIN),
      0
    ) * MAX_NODE_WIDTH;

  // Calculate the number column to fit all the none relationship nodes
  const columnCount = Math.ceil(Math.sqrt(area) / MAX_NODE_WIDTH);
  const columnHeight = Array.from({ length: columnCount }).map(() => 0);
  const columnNodes: Node[][] = Array.from({ length: columnCount }).map(
    () => []
  );

  for (const node of schemaWithoutRelationship) {
    // Get the index of the column with the minimum height
    const columnIndex = columnHeight.indexOf(Math.min(...columnHeight));

    // Calculate the height of the node
    const nodeHeight =
      Math.min(20, node.tableSchema?.columns.length || 0) * 32 + 64;

    // Calculate the position of the node
    const nodeX =
      relationshipRightPosition + NODE_MARGIN + columnIndex * MAX_NODE_WIDTH;
    const nodeY = relationshipTopPosition + columnHeight[columnIndex];

    // Update the height of the column
    columnHeight[columnIndex] += nodeHeight + NODE_MARGIN;

    // Add the node to the column
    columnNodes[columnIndex].push({
      id: String(node.name),
      type: "databaseSchema",
      position: {
        x: nodeX,
        y: nodeY,
      },
      measured: {
        width: 300,
        height: nodeHeight,
      },
      data: {
        label: node.name,
        schema: node.tableSchema?.columns.map((column) => {
          return {
            title: column.name,
            type: column.type,
            pk: !!column.pk,
            fk: foreignKeyList.has(`${node.name}.${column.name}`),
            unique: !!column.constraint?.unique,
          };
        }),
      },
    });
  }

  return {
    initialNodes: [...layoutRelationship.nodes, ...columnNodes.flat()],
    initialEdges: layoutRelationship.edges,
  };
}

function LayoutFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { schema: initialSchema, currentSchemaName, refresh } = useSchema();
  const [schema] = useState(initialSchema);
  const [selectedSchema, setSelectedSchema] = useState(currentSchemaName);

  useEffect(() => {
    if (selectedSchema) {
      const { initialEdges, initialNodes } = mapSchema(schema, selectedSchema);
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [schema, selectedSchema, setNodes, setEdges]);

  const nodeTypes = {
    databaseSchema: DatabaseSchemaNode,
  };

  return (
    <div className="flex h-full flex-col overflow-hidden relative">
      <div className="border-b pb-1">
        <h1 className="text-lg font-semibold text-primary p-4 mb-1">
          Entity Relationship Diagram
        </h1>
      </div>
      <div className="shrink-0 grow-0 border-b border-neutral-200 dark:border-neutral-800">
        <Toolbar>
          <Button variant={"ghost"} size={"sm"} onClick={refresh}>
            <LucideRefreshCcw className="w-4 h-4 text-green-600" />
          </Button>
          <Button
            variant={"ghost"}
            size={"sm"}
            onClick={() => {
              if (selectedSchema) {
                const { initialEdges, initialNodes } = mapSchema(
                  schema,
                  selectedSchema
                );
                setNodes(initialNodes);
                setEdges(initialEdges);
              }
            }}
          >
            <AlignCenterVerticalSimple size={15} />
          </Button>
          <Button
            variant={"ghost"}
            size={"sm"}
            onClick={() => {
              if (selectedSchema) {
                const { initialEdges, initialNodes } = mapSchema(
                  schema,
                  selectedSchema,
                  "TB"
                );
                setNodes(initialNodes);
                setEdges(initialEdges);
              }
            }}
          >
            <AlignCenterHorizontalSimple size={15} />
          </Button>
          <div className="mx-1">
            <Separator orientation="vertical" />
          </div>
          <DownloadImageDiagram />
          <div className="mx-1">
            <Separator orientation="vertical" />
          </div>
          <SchemaNameSelect
            value={selectedSchema}
            onChange={(value) => {
              setSelectedSchema(value);
            }}
          />
        </Toolbar>
      </div>
      {selectedSchema && (
        <div className="flex-1 relative overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            nodeTypes={nodeTypes}
          >
            <Background />
            <Controls />
            <MiniMap />
            {process.env.NODE_ENV === "development" && <DevTools />}
          </ReactFlow>
        </div>
      )}
    </div>
  );
}

export default function RelationalDiagramTab() {
  return (
    <ReactFlowProvider>
      <LayoutFlow />
    </ReactFlowProvider>
  );
}

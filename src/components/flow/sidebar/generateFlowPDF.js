import jsPDF from 'jspdf';

function generateFlowPDF({ nodes, edges, workspace, fileName, paperSize, orientation }) {
  const doc = new jsPDF({ orientation, format: paperSize });

  const nodeWidth = 120;
  const nodeHeight = 40;

  // 1. Title
  doc.setFontSize(12);
  doc.text(`Workspace: ${workspace}`, 10, 10);
  doc.text(`Exported: ${new Date().toLocaleString()}`, 10, 18);

  // 2. Render Nodes
  nodes.forEach(node => {
    const { x, y } = node.position;
    doc.setFillColor(20, 20, 20);
    doc.rect(x, y, nodeWidth, nodeHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(node.data.label || 'Unnamed', x + 5, y + 25);
  });

  // 3. Render Edges
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) return;

    const startX = sourceNode.position.x + nodeWidth / 2;
    const startY = sourceNode.position.y + nodeHeight / 2;
    const endX = targetNode.position.x + nodeWidth / 2;
    const endY = targetNode.position.y + nodeHeight / 2;

    doc.setDrawColor(150);
    doc.line(startX, startY, endX, endY);
  });

  // 4. Save
  doc.save(`${fileName || 'FlowCanvas'}.pdf`);
}

export default generateFlowPDF;
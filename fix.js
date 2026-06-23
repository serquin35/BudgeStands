const fs = require('fs');
const file = 'C:/Users/Serquin/.gemini/antigravity-ide/brain/8ddece1a-871e-4252-b8ae-83863cf551f1/.system_generated/steps/114/output.txt';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

const nodeIndex = data.data.nodes.findIndex(n => n.name === 'Split Elementos');
if (nodeIndex > -1) {
  data.data.nodes[nodeIndex].parameters.jsCode = `const items = $input.all();
if (items.length === 0) {
  throw new Error('No hay elementos activos en catálogo B para sincronizar');
}
console.log('Elementos a sincronizar:', items.length);
return items;`;
}

// Strip read-only properties
const payload = data.data;
delete payload.updatedAt;
delete payload.createdAt;
delete payload.id;
delete payload.shared;
delete payload.versionId;
delete payload.activeVersionId;
delete payload.versionCounter;
delete payload.triggerCount;
delete payload.meta;
delete payload.pinData;
delete payload.nodes[0].notes; // in case

fs.writeFileSync('updated_workflow.json', JSON.stringify(payload));

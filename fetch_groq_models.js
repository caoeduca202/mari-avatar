const fs = require('fs');

async function getGroqModels() {
  const response = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { 'Authorization': 'Bearer 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' }
  });
  const data = await response.json();
  
  fs.writeFileSync('groq_models.json', JSON.stringify(data, null, 2));
}

getGroqModels().catch(console.error);

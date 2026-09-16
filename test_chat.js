const fs = require('fs');

async function testGroq() {
  const modelsToTest = ['qwen/qwen3.8-27b'];
  
  for (const model of modelsToTest) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer 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',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [{role: 'user', content: 'hello'}]
        })
      });
      const data = await response.json();
      console.log(`Model ${model}: ${data.error ? data.error.message : 'SUCCESS'}`);
    } catch (e) {
      console.log(`Model ${model} error: ${e.message}`);
    }
  }
}

testGroq();

export interface AIProvider {
  id: string
  name: string
  slug: string
  description: string
  logo_url: string
  api_base_url: string
  status: string
  created_at: string
}

export interface Integration {
  id: string
  user_id: string
  provider_id: string
  name: string
  api_key_encrypted: string
  config: Record<string, unknown>
  is_active: boolean
  last_tested_at: string | null
  last_status: string
  created_at: string
  updated_at: string
  provider?: AIProvider
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string
  template: string
  files: Record<string, string>
  integration_id: string | null
  prompt_template: string
  status: string
  created_at: string
  updated_at: string
  integration?: Integration
}

export interface ExecutionLog {
  id: string
  project_id: string
  user_id: string
  action: string
  input: string
  output: string
  status: string
  duration_ms: number
  tokens_used: number
  created_at: string
}

export type ProjectTemplate = 'blank' | 'chatbot' | 'code-generator' | 'image-gen' | 'data-analyzer'

export const PROJECT_TEMPLATES: Record<ProjectTemplate, { label: string; description: string; defaultFiles: Record<string, string> }> = {
  blank: {
    label: 'Blank Project',
    description: 'Start from scratch with an empty project',
    defaultFiles: {
      'index.html': '<!DOCTYPE html>\n<html>\n<head><title>My App</title></head>\n<body><div id="app"></div></body>\n</html>',
      'style.css': 'body { font-family: system-ui; margin: 2rem; }\n',
      'main.js': 'console.log("Hello from WebContainer!");\n',
    },
  },
  chatbot: {
    label: 'AI Chatbot',
    description: 'Interactive chatbot with AI provider integration',
    defaultFiles: {
      'index.html': '<!DOCTYPE html>\n<html>\n<head><title>AI Chatbot</title><link rel="stylesheet" href="style.css"></head>\n<body>\n  <div class="chat-container">\n    <div id="messages"></div>\n    <form id="chat-form">\n      <input type="text" id="user-input" placeholder="Type a message..." />\n      <button type="submit">Send</button>\n    </form>\n  </div>\n  <script src="main.js"></script>\n</body>\n</html>',
      'style.css': '.chat-container { max-width: 600px; margin: 2rem auto; }\n#messages { height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 1rem; }\n.message { margin: 0.5rem 0; padding: 0.5rem; border-radius: 8px; }\n.user { background: #3b82f6; color: white; text-align: right; }\n.assistant { background: #f1f5f9; }\nform { display: flex; gap: 0.5rem; margin-top: 1rem; }\ninput { flex: 1; padding: 0.5rem; }\nbutton { padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; cursor: pointer; }',
      'main.js': 'const API_KEY = "{{API_KEY}}";\nconst API_URL = "{{API_URL}}";\n\nconst messagesDiv = document.getElementById("messages");\nconst form = document.getElementById("chat-form");\nconst input = document.getElementById("user-input");\n\nfunction addMessage(role, text) {\n  const div = document.createElement("div");\n  div.className = `message ${role}`;\n  div.textContent = text;\n  messagesDiv.appendChild(div);\n  messagesDiv.scrollTop = messagesDiv.scrollHeight;\n}\n\nform.addEventListener("submit", async (e) => {\n  e.preventDefault();\n  const text = input.value.trim();\n  if (!text) return;\n  addMessage("user", text);\n  input.value = "";\n  addMessage("assistant", "Thinking...");\n});',
    },
  },
  'code-generator': {
    label: 'Code Generator',
    description: 'Generate code snippets using AI',
    defaultFiles: {
      'index.html': '<!DOCTYPE html>\n<html>\n<head><title>Code Generator</title><link rel="stylesheet" href="style.css"></head>\n<body>\n  <div class="container">\n    <h1>AI Code Generator</h1>\n    <textarea id="prompt" placeholder="Describe the code you want..."></textarea>\n    <select id="language"><option>JavaScript</option><option>Python</option><option>TypeScript</option></select>\n    <button id="generate">Generate</button>\n    <pre id="output"></pre>\n  </div>\n  <script src="main.js"></script>\n</body>\n</html>',
      'style.css': '.container { max-width: 800px; margin: 2rem auto; }\ntextarea { width: 100%; height: 100px; padding: 1rem; margin: 1rem 0; }\nselect, button { padding: 0.5rem 1rem; margin: 0.5rem; }\npre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 8px; overflow-x: auto; min-height: 200px; }',
      'main.js': 'const generateBtn = document.getElementById("generate");\ngenerateBtn.addEventListener("click", () => {\n  const prompt = document.getElementById("prompt").value;\n  const lang = document.getElementById("language").value;\n  document.getElementById("output").textContent = `// Generating ${lang} code for: ${prompt}\\n// Connect your AI provider to generate real code`;\n});',
    },
  },
  'image-gen': {
    label: 'Image Generator',
    description: 'Generate images with AI (DALL-E, Stable Diffusion)',
    defaultFiles: {
      'index.html': '<!DOCTYPE html>\n<html>\n<head><title>Image Generator</title><link rel="stylesheet" href="style.css"></head>\n<body>\n  <div class="container">\n    <h1>AI Image Generator</h1>\n    <textarea id="prompt" placeholder="Describe the image..."></textarea>\n    <button id="generate">Generate Image</button>\n    <div id="gallery"></div>\n  </div>\n  <script src="main.js"></script>\n</body>\n</html>',
      'style.css': '.container { max-width: 800px; margin: 2rem auto; text-align: center; }\ntextarea { width: 100%; height: 80px; padding: 1rem; margin: 1rem 0; }\nbutton { padding: 0.75rem 2rem; background: #3b82f6; color: white; border: none; cursor: pointer; border-radius: 8px; }\n#gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(256px, 1fr)); gap: 1rem; margin-top: 2rem; }\n.img-card { border-radius: 8px; overflow: hidden; background: #1e293b; }\n.img-card img { width: 100%; }',
      'main.js': 'document.getElementById("generate").addEventListener("click", () => {\n  const prompt = document.getElementById("prompt").value;\n  const gallery = document.getElementById("gallery");\n  const card = document.createElement("div");\n  card.className = "img-card";\n  card.innerHTML = `<p style="color:white;padding:1rem;">Generating: ${prompt}</p>`;\n  gallery.prepend(card);\n});',
    },
  },
  'data-analyzer': {
    label: 'Data Analyzer',
    description: 'Analyze and visualize data with AI assistance',
    defaultFiles: {
      'index.html': '<!DOCTYPE html>\n<html>\n<head><title>Data Analyzer</title><link rel="stylesheet" href="style.css"></head>\n<body>\n  <div class="container">\n    <h1>AI Data Analyzer</h1>\n    <textarea id="data" placeholder="Paste your data here (CSV, JSON)..."></textarea>\n    <textarea id="question" placeholder="What would you like to know about this data?"></textarea>\n    <button id="analyze">Analyze</button>\n    <div id="results"></div>\n  </div>\n  <script src="main.js"></script>\n</body>\n</html>',
      'style.css': '.container { max-width: 900px; margin: 2rem auto; }\ntextarea { width: 100%; padding: 1rem; margin: 0.5rem 0; }\n#data { height: 150px; }\n#question { height: 60px; }\nbutton { padding: 0.75rem 2rem; background: #3b82f6; color: white; border: none; cursor: pointer; border-radius: 8px; margin: 1rem 0; }\n#results { background: #1e293b; color: #e2e8f0; padding: 1.5rem; border-radius: 8px; min-height: 200px; white-space: pre-wrap; }',
      'main.js': 'document.getElementById("analyze").addEventListener("click", () => {\n  const data = document.getElementById("data").value;\n  const question = document.getElementById("question").value;\n  document.getElementById("results").textContent = `Analyzing data (${data.length} chars)...\nQuestion: ${question}\n\nConnect your AI provider to get real analysis results.`;\n});',
    },
  },
}

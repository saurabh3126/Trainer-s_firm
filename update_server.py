import re

with open('backend/server.js', 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace the exact parsing block
old_parse_block = """        const result = await model.generateContent(prompt);
        let aiResponseText = result.response.text().trim();"""

new_parse_block = """        let aiResponseText = '';
        try {
            const result = await model.generateContent(prompt);
            aiResponseText = result.response.text().trim();
        } catch (geminiError) {
            console.warn("Gemini parsing failed, falling back to ChatGPT:", geminiError.message);
            if (!process.env.OPENAI_API_KEY) {
                console.error("OpenAI API key is missing. Cannot fallback.");
                return res.status(500).json({ error: "Parsing failed and backup AI is not configured." });
            }
            
            try {
                const openaiResponse = await axios.post(
                    'https://api.openai.com/v1/chat/completions',
                    {
                        model: "gpt-3.5-turbo",
                        messages: [
                            { role: "system", content: "You are a highly capable AI assistant that strictly returns valid JSON." },
                            { role: "user", content: prompt }
                        ],
                        temperature: 0.2
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                aiResponseText = openaiResponse.data.choices[0].message.content.trim();
            } catch (openaiError) {
                console.error("ChatGPT Fallback Error:", openaiError.response?.data || openaiError.message);
                return res.status(500).json({ error: "Both primary and backup AI failed to parse requirement." });
            }
        }"""

content = content.replace(old_parse_block, new_parse_block)

with open('backend/server.js', 'w', encoding='utf-8') as f:
    f.write(content)

import { Router } from 'express';
import http from '../../lib/http.js';
const router = Router();

async function deepAiChat(question: string, systemPrompt?: string) {
  let chatHistory = [
    {
      "role": "user",
      "content": systemPrompt ? systemPrompt.trim() : "reply straight to the point."
    },
    {
      "role": "assistant",
      "content": "okay"
    },
    {
      "role": "user",
      "content": question
    }
  ]

  const body = "------WebKitFormBoundaryByWolep_cihuy\r\nContent-Disposition: form-data; name=\"chat_style\"\r\n\r\nchat\r\n------WebKitFormBoundaryByWolep_cihuy\r\nContent-Disposition: form-data; name=\"chatHistory\"\r\n\r\n" + JSON.stringify(chatHistory) + "\r\n------WebKitFormBoundaryByWolep_cihuy\r\nContent-Disposition: form-data; name=\"model\"\r\n\r\nstandard\r\n------WebKitFormBoundaryByWolep_cihuy\r\nContent-Disposition: form-data; name=\"hacker_is_stinky\"\r\n\r\nvery_stinky\r\n------WebKitFormBoundaryByWolep_cihuy--\r\n";
  const { data } = await http.post("https://api.deepai.org/hacking_is_a_serious_crime", body, {
    headers: { "content-type": "multipart/form-data; boundary=----WebKitFormBoundaryByWolep_cihuy" },
    responseType: 'text',
    transformResponse: [(value) => value]
  });
  return data;
}

router.get('/', async (req, res) => {
    const { text, sysPrompt } = req.body || req.query;
    try {
        let response;
        if (!text) return res.status(400).json({
            message: 'text is required'
        });
        response = sysPrompt ? await deepAiChat(text, sysPrompt) : await deepAiChat(text);
        return res.status(200).json({
            question: text,
            additionalPrompt: sysPrompt,
            result: response
        })
    } catch (e: any) {
        return res.status(500).json({
            message: e
        })
    }
})

export default router;
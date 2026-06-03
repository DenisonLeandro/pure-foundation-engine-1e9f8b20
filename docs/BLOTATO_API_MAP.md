# Blotato REST API — Complete Map
## Base URL: https://backend.blotato.com/v2
## Auth: Header `blotato-api-key: YOUR_KEY`
## Rate Limit: 30 req/min (media upload: 10 req/min)
## Source: Crawled 86 pages from help.blotato.com via Firecrawl

---

## Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | User info (id, subscriptionStatus, apiKey) |
| GET | `/users/me/accounts` | List connected accounts. Query: `?platform=twitter` |
| GET | `/users/me/accounts/:id/subaccounts` | List subaccounts (FB Pages, LinkedIn Pages) |

## Publishing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/posts` | Create/publish post. Body: `{ post: { accountId, content, target }, scheduledTime?, useNextFreeSlot? }` |
| GET | `/posts/:postSubmissionId` | Get post status (in-progress → published/scheduled/failed) |

### Post Body Schema
```json
{
  "post": {
    "accountId": "string",
    "content": {
      "text": "string",
      "mediaUrls": ["string"],
      "platform": "twitter|instagram|facebook|linkedin|tiktok|pinterest|threads|bluesky|youtube|other",
      "additionalPosts": [{ "text": "string", "mediaUrls": ["string"] }]
    },
    "target": {
      "targetType": "twitter|instagram|facebook|linkedin|tiktok|pinterest|threads|bluesky|youtube|webhook",
      // Platform-specific:
      "pageId": "string",           // Facebook (required), LinkedIn (optional)
      "replyControl": "string",     // Threads
      "privacyLevel": "string",     // TikTok (required)
      "disabledComments": "bool",   // TikTok (required)
      "disabledDuet": "bool",       // TikTok (required)
      "disabledStitch": "bool",     // TikTok (required)
      "isBrandedContent": "bool",   // TikTok (required)
      "isYourBrand": "bool",        // TikTok (required)
      "isAiGenerated": "bool",      // TikTok (required)
      "boardId": "string",          // Pinterest (required)
      "title": "string",            // YouTube (required), Pinterest, TikTok
      "privacyStatus": "string",    // YouTube (required): public|private|unlisted
      "shouldNotifySubscribers": "bool", // YouTube (required)
      "mediaType": "string",        // Instagram: reel|story, Facebook: reel|video
      "link": "string",             // Facebook, Pinterest
      "altText": "string",          // Instagram, Pinterest
      "collaborators": ["string"],  // Instagram
      "coverImageUrl": "string",    // Instagram
      "shareToFeed": "bool",        // Instagram
      "audioName": "string",        // Instagram
      "autoAddMusic": "bool",       // TikTok
      "isDraft": "bool",            // TikTok
      "isMadeForKids": "bool",      // YouTube
      "containsSyntheticMedia": "bool", // YouTube
      "url": "string"               // Webhook target
    }
  },
  "scheduledTime": "ISO8601",
  "useNextFreeSlot": true
}
```

## Media

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/media` | Upload media from URL. Body: `{ url: "string" }`. Also supports base64. Returns `{ url, id }`. Rate: 10/min. Max 1GB. |

## Schedules

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/schedules` | List future scheduled posts. Query: `?limit=50&cursor=...` |
| GET | `/schedules/:id` | Get single scheduled post |
| PATCH | `/schedules/:id` | Update scheduled post. Body: `{ scheduledTime?, post? }` |
| DELETE | `/schedules/:id` | Delete scheduled post |

## Visuals (Videos/Images)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/videos/templates` | List all templates. Query: `?fields=id,name,description,inputs&search=...&id=...` |
| POST | `/videos/from-templates` | Create visual. Body: `{ templateId, prompt?, inputs?, render?, isDraft? }` |
| GET | `/videos/creations/:id` | Get visual status. Returns `{ item: { id, status, mediaUrl, imageUrls } }` |
| DELETE | `/videos/:id` | Delete visual |

### Visual Status Flow
`queueing → generating-script → script-ready → generating-media → media-ready → exporting → done`

### 35 Visual Templates Available
**AI Videos (3):**
- AI Video with AI Voice (`/base/v2/ai-story-video/5903fe43...`)
- AI Selfie Talking Video (`/base/v2/ai-selfie-video/57f5a565...`)
- AI Avatar with B-roll (`/base/v2/ai-avatar-broll/7c26a1cd...`)

**Carousels (4):**
- Tutorial Carousel Monocolor (`/base/v2/tutorial-carousel/e095104b...`)
- Tutorial Carousel Minimalist (`/base/v2/tutorial-carousel/2491f97b...`)
- Quote Card Paper Background (`/base/v2/quote-card/f941e306...`)
- Quote Card Monocolor (`/base/v2/quote-card/77f65d2b...`)

**Cards (3):**
- Tweet Card Minimal (`/base/v2/tweet-card/ba413be6...`)
- Tweet Card Photo Background (`/base/v2/tweet-card/9714ae5c...`)
- Single Centered Text Quote (`9f4e66cd...`)

**Slideshows (4):**
- Image Slideshow with Text (`/base/v2/image-slideshow/5903b592...`)
- Prominent Text Slideshow (`/base/v2/images-with-text/0ddb8655...`)
- When X then Y (`/base/v2/images-with-text/c9892c3b...`)
- Minimal Style Video (`/base/v2/images-with-text/3ed4bb92...`)

**Editing (1):**
- Combine Clips (`/base/v2/combine-clips/c306ae43...`)

**Product (1):**
- Product Placement (`f524614b...`)

**Infographics (20):**
TV Wall, Newspaper, Breaking News, Movie Theater, Graffiti, Bus Ad, Billboard, Classroom, Whiteboard, Chalkboard, Trail Marker, Constellation, Manga, T-Shirt, Futuristic Flyer, Book Page, Steampunk, Top Secret, Egyptian, Cave Painting

## Sources (Content Extraction)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/source-resolutions-v3` | Extract content. Body: `{ source: { sourceType, url?, text? }, customInstructions? }` |
| GET | `/source-resolutions-v3/:id` | Get extraction status. Returns `{ id, status, title, content }` |

### Source Types
- `youtube` — Video transcript from URL
- `tiktok` — Video transcript from URL
- `article` — Web page content from URL
- `pdf` — Document text from URL
- `audio` — Transcription (mp3, wav, m4a, ogg, flac, aac)
- `twitter` — Tweet content from URL
- `text` — Raw text processing
- `perplexity-query` — AI-powered web research

## AI Voices (ElevenLabs)

| Voice ID | Name | Tags |
|----------|------|------|
| `elevenlabs/eleven_multilingual_v2/Xb7hH8MSUJpSbSDYk0k2` | Alice | British, confident |
| `elevenlabs/eleven_multilingual_v2/9BWtsMINqrJLrRacOk9x` | Aria | American, expressive |
| `elevenlabs/eleven_multilingual_v2/pqHfZKP75CvOlQylNhV4` | Bill | American, trustworthy |
| `elevenlabs/eleven_multilingual_v2/nPczCjzI2devNBz1zQrb` | Brian | American, deep |
| `elevenlabs/eleven_multilingual_v2/N2lVS1w4EtoT3dr4eOWO` | Callum | Transatlantic, intense |
| `elevenlabs/eleven_multilingual_v2/IKne3meq5aSn9XLyUdCD` | Charlie | Australian, natural |
| `elevenlabs/eleven_multilingual_v2/XB0fDUnXU5powFXDhCwa` | Charlotte | Swedish, seductive |
| `elevenlabs/eleven_multilingual_v2/iP95p4xoKVk53GoZ742B` | Chris | American, casual |
| `elevenlabs/eleven_multilingual_v2/onwK4e9ZLuTAKqWW03F9` | Daniel | British, authoritative |
| `elevenlabs/eleven_multilingual_v2/cjVigY5qzO86Huf0OWal` | Eric | American, friendly |
| `elevenlabs/eleven_multilingual_v2/JBFqnCBsd6RMkjVDRZzb` | George | British, warm |
| `elevenlabs/eleven_multilingual_v2/cgSgspJ2msm6clMCkdW9` | Jessica | American, expressive |
| `elevenlabs/eleven_multilingual_v2/FGY2WhTYpPnrIDTdsKH5` | Laura | American, upbeat |
| `elevenlabs/eleven_multilingual_v2/TX3LPaxmHKxFdv7VOQHJ` | Liam | American, articulate |
| `elevenlabs/eleven_multilingual_v2/pFZP5JQG7iQjIQuC4Bku` | Lily | British, warm |
| `elevenlabs/eleven_multilingual_v2/XrExE9yKIg1WjnnlVkGX` | Matilda | American, friendly |
| `elevenlabs/eleven_multilingual_v2/SAz9YHcvj6GT2YYXdXww` | River | Non-binary, confident |
| `elevenlabs/eleven_multilingual_v2/CwhRBWXzGAHq8TQ4Fs17` | Roger | American, confident |
| `elevenlabs/eleven_multilingual_v2/EXAVITQu4vr4xnSDxMaL` | Sarah | American, soft |
| `elevenlabs/eleven_multilingual_v2/bIHbv24MWmeRgasZH58o` | Will | American, friendly |

## Automation Templates (from docs)
1. Post Everywhere
2. Email to Long Form Thread
3. Hackernews to AI Clone Videos
4. Viral News to AI Avatar Videos
5. Automate Instagram Carousels with AI Chat
7. Clone Viral Reels with AI Avatar
8. Repurpose TikToks on Autopilot
10. Gamma Templates
11. Build Your First AI Automation

## Proxy Tool Mapping (our Edge Function)

| Frontend Tool Name | REST Method | REST Path |
|---|---|---|
| `blotato_get_user` | GET | `/users/me` |
| `blotato_list_accounts` | GET | `/users/me/accounts` |
| `blotato_list_subaccounts` | GET | `/users/me/accounts/:id/subaccounts` |
| `blotato_create_post` | POST | `/posts` |
| `blotato_get_post_status` | GET | `/posts/:id` |
| `blotato_list_schedules` | GET | `/schedules` |
| `blotato_get_schedule` | GET | `/schedules/:id` |
| `blotato_update_schedule` | PATCH | `/schedules/:id` |
| `blotato_delete_schedule` | DELETE | `/schedules/:id` |
| `blotato_list_visual_templates` | GET | `/videos/templates` |
| `blotato_create_visual` | POST | `/videos/from-templates` |
| `blotato_get_visual_status` | GET | `/videos/creations/:id` |
| `blotato_delete_visual` | DELETE | `/videos/:id` |
| `blotato_create_source` | POST | `/source-resolutions-v3` |
| `blotato_get_source_status` | GET | `/source-resolutions-v3/:id` |
| `blotato_upload_media` | POST | `/media` |

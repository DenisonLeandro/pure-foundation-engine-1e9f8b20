# Blotato Complete API Reference
# Crawled: 86 pages, 86 API-relevant

# Setup Guide | Blotato Help
URL: https://help.blotato.com/api/mcp/setup

## [hashtag](https://help.blotato.com/api/mcp/setup\#tutorials)    Tutorials

Step-by-step video walkthrough for setting up Blotato with Claude Code:

- [Build Your AI Personal Assistant for Social Media Marketingarrow-up-right](https://youtu.be/3HVH2Iuplqo)

- [The ULTIMATE Claude Code Tutorialarrow-up-right](https://youtu.be/fYX6hHC9FhQ) (brand voice, quality gates, subagents)


## [hashtag](https://help.blotato.com/api/mcp/setup\#prerequisites)    Prerequisites

1. A paid Blotato subscription

2. Your Blotato API key (get it from [Settings > APIarrow-up-right](https://my.blotato.com/settings/api))

3. At least one connected social account in [Settingsarrow-up-right](https://my.blotato.com/settings)


* * *

## [hashtag](https://help.blotato.com/api/mcp/setup\#claude-desktop)    Claude Desktop

1. Open Claude Desktop

2. Go to Settings > Developer > Edit Config

3. Add the following to your `claude_desktop_config.json`:


Copy

```
{
  "mcpServers": {
    "blotato": {
      "url": "https://mcp.blotato.com/mcp",
      "headers": {
        "blotato-api-key": "YOUR_API_KEY"
      }
    }
  }
}
```

1. Replace `YOUR_API_KEY` with your Blotato API key

2. Restart Claude Desktop

3. Verify by asking: "What social media accounts do I have connected?"


* * *

## [hashtag](https://help.blotato.com/api/mcp/setup\#claude-code)    Claude Code

1. Open your terminal

2. Run the following command:


Copy

```
claude mcp add blotato \
  --url https://mcp.blotato.com/mcp \
  --header "blotato-api-key: YOUR_API_KEY"
```

1. Replace `YOUR_API_KEY` with your Blotato API key

2. Verify by asking: "What social media accounts do I have connected?"


* * *

## [hashtag](https://help.blotato.com/api/mcp/setup\#cursor)    Cursor

1. Open Cursor

2. Go to Settings > MCP

3. Click "Add new MCP server"

4. Enter the following configuration:


Copy

```
{
  "mcpServers": {
    "blotato": {
      "url": "https://mcp.blotato.com/mcp",
      "headers": {
        "blotato-api-key": "YOUR_API_KEY"
      }
    }
  }
}
```

1. Replace `YOUR_API_KEY` with your Blotato API key

2. Verify by asking: "What social media accounts do I have connected?"


* * *

## [hashtag](https://help.blotato.com/api/mcp/setup\#claude-cowork)    Claude Cowork

1. Open Claude Cowork

2. Go to Menu > Developer > App Config File

3. Add the Blotato MCP server to your configuration:


Copy

```
{
  "mcpServers": {
    "blotato": {
      "url": "https://mcp.blotato.com/mcp",
      "headers": {
        "blotato-api-key": "YOUR_API_KEY"
      }
    }
  }
}
```

1. If your config file already has other content (e.g., a `preferences` section), add a comma after the previous section before adding `mcpServers`

2. Replace `YOUR_API_KEY` with your Blotato API key

3. Restart Claude Cowork

4. Verify by asking: "What social media accounts do I have connected?"


* * *

## [hashtag](https://help.blotato.com/api/mcp/setup\#verify-your-connection)    Verify Your Connection

After setup, test the connection by asking your AI tool:

> "What social media accounts do I have connected?"

The tool calls `blotato_list_accounts` and returns your connected platforms. If you see your accounts listed, the setup is complete.

* * *

## [hashtag](https://help.blotato.com/api/mcp/setup\#troubleshooting)    Troubleshooting

If the MCP server connects but does not work as expected:

1. Double check you copy/pasted the correct API key from [Settings > APIarrow-up-right](https://my.blotato.com/settings/api). Make sure there are no extra spaces or missing characters.

2. Restart your Claude Code / Claude Desktop / Claude Cowork session after installing the MCP server. MCP servers load on startup.

3. Tell your AI tool the API key is correct and point it to the help docs. For example: "My Blotato API key is correct. Reference this doc for instructions: https://help.blotato.com/api/llm"

4. Verify you have a paid Blotato subscription. API access requires a paid plan.

5. Verify you have at least one social account connected in [Settingsarrow-up-right](https://my.blotato.com/settings).

6. If you get a JSON parsing error in your config file, validate it at [jsonlint.comarrow-up-right](https://jsonlint.com/). A common mistake is a missing comma between sections.


Video walkthrough: [Build Your AI Personal Assistant for Social Media Marketingarrow-up-right](https://youtu.be/3HVH2Iuplqo)

[PreviousMCP Serverchevron-left](https://help.blotato.com/api/mcp) [NextTools Referencechevron-right](https://help.blotato.com/api/mcp/tools)

Last updated 9 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# MCP Server | Blotato Help
URL: https://help.blotato.com/api/mcp

The Blotato MCP Server lets you control your social media workflows directly from AI tools like Claude Desktop, Claude Code, and Cursor.

No installation or coding required. Add the server URL and your API key to your AI tool's config, and start giving natural language commands.

## [hashtag](https://help.blotato.com/api/mcp\#what-you-get)    What You Get

- Post to any connected social platform with a single prompt

- Schedule posts to your content calendar

- Extract content from YouTube videos, articles, tweets, and more

- Generate images, carousels, and videos from templates

- Check the status of your posts and visuals


## [hashtag](https://help.blotato.com/api/mcp\#tutorials)    Tutorials

- [Build Your AI Personal Assistant for Social Media Marketingarrow-up-right](https://youtu.be/3HVH2Iuplqo)

- [The ULTIMATE Claude Code Tutorialarrow-up-right](https://youtu.be/fYX6hHC9FhQ)


For Claude Code-specific tutorials, see [Claude Code](https://help.blotato.com/api/claude-code).

## [hashtag](https://help.blotato.com/api/mcp\#quick-setup)    Quick Setup

1. Get your API key from [Settings > APIarrow-up-right](https://my.blotato.com/settings/api)

2. Connect your social accounts in [Settingsarrow-up-right](https://my.blotato.com/settings)

3. Add the Blotato MCP server to your AI tool (see [Setup Guide](https://help.blotato.com/api/mcp/setup))


**Server URL**: `https://mcp.blotato.com/mcp`

**Auth header**: `blotato-api-key: YOUR_API_KEY`

For step-by-step setup instructions, see the [Setup Guide](https://help.blotato.com/api/mcp/setup).

For all available tools and parameters, see the [Tools Reference](https://help.blotato.com/api/mcp/tools).

For example prompts and multi-step workflows, see [Example Prompts](https://help.blotato.com/api/mcp/examples).

[PreviousClaude Codechevron-left](https://help.blotato.com/api/claude-code) [NextSetup Guidechevron-right](https://help.blotato.com/api/mcp/setup)

Last updated 9 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# 7 Clone Viral Reels with AI Avatar | Blotato Help
URL: https://help.blotato.com/api/templates/7-clone-viral-reels-with-ai-avatar

![Page cover](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252F8PdP4AHthNesyUAQe7m5%252FScreenshot%25202025-09-13%2520at%252010.19.31%25E2%2580%25AFAM.png%3Falt%3Dmedia%26token%3D0857ff69-2e9b-4b04-b1a5-ecc1457fa0da&width=1248&dpr=3&quality=100&sign=8774e33&sv=2)

### [hashtag](https://help.blotato.com/api/templates/7-clone-viral-reels-with-ai-avatar\#description)    Description

This fully automated AI Avatar Reel Repurposing system lets you take any Instagram Reel and instantly transform it into your own branded AI avatar video, WITHOUT having to film or edit yourself. It combines content analysis, script rewriting, and HeyGen AI avatars to download reels, rewrite scripts and captions into a short 30-second format, regenerate the video with your chosen avatar and voice, and automatically post across every major social media platform including Instagram, TikTok, YouTube, Facebook, LinkedIn, Pinterest, Twitter/X, and Threads. Everything runs end-to-end in the background, so you only paste a link, and the system handles downloading, rewriting, recording, and publishing your content every single day.

### [hashtag](https://help.blotato.com/api/templates/7-clone-viral-reels-with-ai-avatar\#platforms)    Platforms

n8n

Make

Zapier

check

check

### [hashtag](https://help.blotato.com/api/templates/7-clone-viral-reels-with-ai-avatar\#templates)    Templates

[https://drive.google.com/drive/folders/1Hyqe\_JVSuLZ59JrKTOBbN4GaXwwoAxnk?usp=drive\_linkarrow-up-right](https://drive.google.com/drive/folders/1Hyqe_JVSuLZ59JrKTOBbN4GaXwwoAxnk?usp=drive_link)

### [hashtag](https://help.blotato.com/api/templates/7-clone-viral-reels-with-ai-avatar\#tutorials)    Tutorials

#### [hashtag](https://help.blotato.com/api/templates/7-clone-viral-reels-with-ai-avatar\#n8n)    n8n

I built a 24/7 Viral Reels clone machine with no-code (free n8n template) - YouTube

Tap to unmute

[I built a 24/7 Viral Reels clone machine with no-code (free n8n template)](https://www.youtube.com/watch?v=BdKqEkdvlgQ) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄165K subscribers

[Watch on](https://www.youtube.com/watch?v=BdKqEkdvlgQ)

#### [hashtag](https://help.blotato.com/api/templates/7-clone-viral-reels-with-ai-avatar\#make)    Make

Repurpose Instagram Reels with Human Approval (Make) - YouTube

Tap to unmute

[Repurpose Instagram Reels with Human Approval (Make)](https://www.youtube.com/watch?v=YZn6MuUIW0A) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄165K subscribers

[Watch on](https://www.youtube.com/watch?v=YZn6MuUIW0A)

- Make template does not automatically check if your Airtable record has a background URL. Instead, it will create a Heygen avatar video WITHOUT a background.

- If you want to create avatar videos with an image or video background, edit the CREATE VIDEO module as follows:



  - enable parameter `matting` to yes

  - scroll down and select `background type`

  - select image or video background

  - drop in `backgroundUrl` variable from Airtable


### [hashtag](https://help.blotato.com/api/templates/7-clone-viral-reels-with-ai-avatar\#overview)    Overview

Here’s how the automation works:

**1\. Trigger: Airtable Input**

\\* Paste the Instagram Reel link into the \`ReelURL\` column (optional: add a \`BackgroundURL\`).

**2\. Reel Processing**

\- Transcribe the Reel audio

\- Rewrite into ~30 seconds of spoken text

\- Generate SEO-optimized caption

\- Create a viral overlay sentence for attention, that can be used as the title

**3\. Trigger 2: Human Approval**

\- Edit or approve the Script, Caption, and Overlay in Airtable

\- Check the \`Approved\` box to confirm content is ready

**4\. Create Avatar Video**

\- Call Heygen API (requires paid API plan), specifying your avatar ID and voice ID

\- Create avatar video, optionally passing in an image/video background if you have a green screen avatar

**5\. Get Video**

\- Wait awhile, then fetch completed avatar video

**6\. Publish to Social Media**

\- Pass the video URL directly to the Blotato Publish node - no upload step required

\- Connect Blotato to your social accounts

\- Choose your social accounts

\- Either post immediately or schedule for later

### [hashtag](https://help.blotato.com/api/templates/7-clone-viral-reels-with-ai-avatar\#setup)    Setup

- [Install the Blotato and Apify community nodesarrow-up-right](https://help.blotato.com/api/n8n/n8n-blotato-node)

- [**Airtable** arrow-up-right](https://airtable.com/) Create a free account, then visit the [Personal Access Token Pagearrow-up-right](https://airtable.com/create/tokens) and create a new key (make sure to add `data.records:read`, `data.records:write`, `schema.bases:read` in Scopes and add your base in Access). Then create Airtable credential. Clone [this Airtable Databasearrow-up-right](https://airtable.com/appKGAkMPhWAhL9dF/shriczYSic1SRJzU2). Copy your newly made Airtable Database URL and paste it in both Airtable Triggers under `Base URL` and `Table URL`.

- [**Blotato** arrow-up-right](https://blotato.com/) Sign up on Blotato, then go to [Dashboard → API Keysarrow-up-right](https://my.blotato.com/settings/api) to create your key. Then create Blotato credential.

- [**Apify** arrow-up-right](https://apify.com/) Create a free account, then visit [Account → Integrations → API Tokensarrow-up-right](https://console.apify.com/settings/integrations) to generate your token. Then create Apify credential.

- [**OpenAI** arrow-up-right](https://platform.openai.com/) Create a free account, then go to the [API Keys pagearrow-up-right](https://platform.openai.com/api-keys) and create a new key. Then create OpenAI credential.

- [**HeyGen\_API** arrow-up-right](https://www.heygen.com/) Sign up and visit the [API access pagearrow-up-right](https://app.heygen.com/settings?from=&nav=Subscriptions%20%26%20API) to request an API key. Then paste the generated API Key under `HeyGen_API` in the Setup Node.

- [**Avatar\_ID** arrow-up-right](https://www.heygen.com/) After creating/choosing an avatar in HeyGen, go to **Avatars** in the dashboard → copy the avatar ID from the developer panel. Then paste the Avatar ID under `Avatar_ID` in the Setup Node.

- [**Voice\_ID** arrow-up-right](https://www.heygen.com/) In the HeyGen **Voices** section, select your desired voice and copy its ID from the developer panel or API docs. Then paste the Voice ID under `Voice_ID` in the Setup Node.

- Follow the 3 setup instruction in BROWN sticky notes in this template.

- If you want a background image/video behind your avatar, also add a publicly accessible link to the Background Video on Airtable Database in the field `BackgroundURL`. I only recommend doing this AFTER the full workflow is operational.


### [hashtag](https://help.blotato.com/api/templates/7-clone-viral-reels-with-ai-avatar\#tips-and-tricks)    Tips & Tricks

- While testing: enable only 1 social platform, and deactivate the rest for testing purposes. Update the AI agent node’s prompt to return a 5-second script, rather than 30 seconds, to reduce the processing duration.

- Go to Heygen and check that your avatar video is being processed.

- After the workflow finishes, check your social media account for the final post.

- If successful, then enable another social media node, and continue testing.

- Update prompt to match your niche / industry


### [hashtag](https://help.blotato.com/api/templates/7-clone-viral-reels-with-ai-avatar\#troubleshooting)    Troubleshooting

- Sometimes the Apify Scraper fails, let it loop to try again (usually works 2nd time)

- OpenAI API account must have billing funded

- make sure you copied your avatar ID correctly, not the group avatar ID

- If your script is long, it takes more time for your video to finish


If you need help troubleshooting your automation:

- the [API Dashboardarrow-up-right](https://my.blotato.com/api-dashboard) is your best friend

- go to Blotato and click the ORANGE BUTTON in the bottom right corner to send me a message


Other helpful links:

**👉** [**Blotato API Docs** arrow-up-right](https://help.blotato.com/api)

✅ [**Troubleshoot Errors** arrow-up-right](https://my.blotato.com/api-dashboard)

📷 [**Media Requirements** arrow-up-right](https://help.blotato.com/api/media)

[Previous5 Automate Instagram Carousels with AI Chatchevron-left](https://help.blotato.com/api/templates/5-automate-instagram-carousels-with-ai-chat) [Next8 Repurpose Tiktoks On Autopilotchevron-right](https://help.blotato.com/api/templates/8-repurpose-tiktoks-on-autopilot)

Last updated 3 months ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# 8 Repurpose Tiktoks On Autopilot | Blotato Help
URL: https://help.blotato.com/api/templates/8-repurpose-tiktoks-on-autopilot

![Page cover](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252FwriEtCpbOX9qplvnxd3H%252FScreenshot%25202025-10-15%2520at%252012.01.58%25E2%2580%25AFPM.png%3Falt%3Dmedia%26token%3D1797c2ed-e43e-469f-b981-ea1ddb720dcc&width=1248&dpr=3&quality=100&sign=de4c7d6b&sv=2)

### [hashtag](https://help.blotato.com/api/templates/8-repurpose-tiktoks-on-autopilot\#description)    Description

This automation detects when you post a Tiktok video, automatically downloads the video without watermark, stores it in Google Drive, and reposts your Tiktok video to other social media platforms. All on autopilot. So you can grow your presence on multiple platforms, without more work. You can also easily add steps to customize captions per platform.

### [hashtag](https://help.blotato.com/api/templates/8-repurpose-tiktoks-on-autopilot\#platforms)    Platforms

n8n

Make

Zapier

check

### [hashtag](https://help.blotato.com/api/templates/8-repurpose-tiktoks-on-autopilot\#templates)    Templates

[https://drive.google.com/drive/folders/11wxzyRm9OzrBzON-zMkubsXvi0DS8dAi?usp=sharingarrow-up-right](https://drive.google.com/drive/folders/11wxzyRm9OzrBzON-zMkubsXvi0DS8dAi?usp=sharing)

### [hashtag](https://help.blotato.com/api/templates/8-repurpose-tiktoks-on-autopilot\#tutorials)    Tutorials

How I repurpose Tiktoks automatically (simple n8n automation) - YouTube

Tap to unmute

[How I repurpose Tiktoks automatically (simple n8n automation)](https://www.youtube.com/watch?v=yHbyEb-fBGY) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

Sabrina Ramonov 🍄165K subscribers

[Watch on](https://www.youtube.com/watch?v=yHbyEb-fBGY)

### [hashtag](https://help.blotato.com/api/templates/8-repurpose-tiktoks-on-autopilot\#overview)    Overview

Here’s how the automation works:

**1\. Trigger: RSS Feed**

- RSS feed triggers when you post a new Tiktok video


**2\. Fetch Video**

- Download the newly posted Tiktok video

- Store video in Google Drive


**3\. Publish to Social Media**

- Connect Blotato to your social accounts

- Choose your social accounts

- Either post immediately or schedule for later


### [hashtag](https://help.blotato.com/api/templates/8-repurpose-tiktoks-on-autopilot\#setup)    Setup

- [Install the Blotato community nodearrow-up-right](https://help.blotato.com/api/n8n/n8n-blotato-node)

- [**Blotato** arrow-up-right](https://blotato.com/) Sign up for Blotato, then go to [Dashboard → API Keysarrow-up-right](https://my.blotato.com/settings/api) to create your key. Then create Blotato credential. Connect your social accounts, and select which accounts to post to.

- [**RSS.app** arrow-up-right](https://rss.app/) Create an account, then visit [Feedsarrow-up-right](https://rss.app/myfeeds), click "Add Feed", input your Tiktok profile URL, and generate the RSS feed. Copy paste RSS feed URL into the RSS Feed Trigger node. Within rss.app, configure your RSS feed setting "Number of Posts" to 1.


### [hashtag](https://help.blotato.com/api/templates/8-repurpose-tiktoks-on-autopilot\#tips-and-tricks)    Tips & Tricks

- While testing: enable only 1 social platform, and deactivate the rest for testing purposes. You can also use the option "Scheduled Time" while testing, so that posts are scheduled in the future, not posted immediately.

- After the workflow finishes, check your social media account for the final post.

- If successful, then enable another social media node, and continue testing.


### [hashtag](https://help.blotato.com/api/templates/8-repurpose-tiktoks-on-autopilot\#troubleshooting)    Troubleshooting

- Make sure your RSS feed is configured to output only 1 item at a time

- If you post multiple Tiktok videos within an hour interval, you can set your refresh interval to 15 minutes in RSS.app but this requires a paid plan.\


If you need help troubleshooting your automation:

- the [API Dashboardarrow-up-right](https://my.blotato.com/api-dashboard) is your best friend

- go to Blotato and click the ORANGE BUTTON in the bottom right corner to send me a message


Other helpful links:

**👉** [**Blotato API Docs** arrow-up-right](https://help.blotato.com/api)

✅ [**Troubleshoot Errors** arrow-up-right](https://my.blotato.com/api-dashboard)

📷 [**Media Requirements** arrow-up-right](https://help.blotato.com/api/media)

### [hashtag](https://help.blotato.com/api/templates/8-repurpose-tiktoks-on-autopilot\#n8n-notes)    n8n Notes

1. [Install the Blotato community nodearrow-up-right](https://help.blotato.com/api/n8n/n8n-blotato-node)

2. If a template shows question marks instead of the Blotato logo, install the Blotato node first, then re-import the template.

3. Create a new Credential in n8n. Go to Blotato Settings > API > Copy API Key. Paste the API key in n8n, save, test, then select this credential on Blotato nodes.

4. Connect social accounts on each platform node. Open each Blotato Publish node, select the Blotato credential, then pick your social account.

5. When testing, deactivate all social platform nodes. Activate just 1 to start with. Run the workflow, then Pin data at the Blotato Publish node. This locks inputs for repeat tests. Then, execute 1 platform node from pinned data to validate it works. Activate other social platforms to continue testing.

6. Use the [Blotato API dashboardarrow-up-right](https://my.blotato.com/api-dashboard) to review each request, payload, and error message.


### [hashtag](https://help.blotato.com/api/templates/8-repurpose-tiktoks-on-autopilot\#make-notes)    Make Notes

n/a

### [hashtag](https://help.blotato.com/api/templates/8-repurpose-tiktoks-on-autopilot\#zapier-notes)    Zapier Notes

n/a

[Previous7 Clone Viral Reels with AI Avatarchevron-left](https://help.blotato.com/api/templates/7-clone-viral-reels-with-ai-avatar) [Next10 Gamma Templateschevron-right](https://help.blotato.com/api/templates/10-gamma-templates)

Last updated 3 months ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# API Quickstart | Blotato Help
URL: https://help.blotato.com/api/start

## [hashtag](https://help.blotato.com/api/start\#get-started-with-blotato-api)    Get Started with Blotato API

The Blotato API allows you to:

- publish and schedule posts directly to social media platforms

- supports text, image, videos, reels, slideshows, carousels, threads, and stories

- create images, videos, slideshows, and carousels programmatically via templates


It is limited to paying subscribers in order to reduce spam and service abuse, keeping Blotato's integration in good standing with the social platforms.

* * *

## [hashtag](https://help.blotato.com/api/start\#id-1.-get-your-api-key)    1\. Get Your API Key

❗ **IMPORTANT: this will end your free trial immediately and start your paid subscription.**

Go to [Settingsarrow-up-right](https://my.blotato.com/settings) \> API > click "Generate API Key".

* * *

## [hashtag](https://help.blotato.com/api/start\#id-2.-connect-social-accounts)    2\. Connect Social Accounts

Go to [Settingsarrow-up-right](https://my.blotato.com/settings) and connect your social accounts. If you get stuck, more information here:

[![Logo](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F208704740-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FdKnwL0PjrkkCOTNetB3Y%252Fsites%252Fsite_BrYWB%252Ficon%252F2EJYRAZoxTgN3UxIVtMn%252Fblotato-logo.png%3Falt%3Dmedia%26token%3D04bfc43a-c88e-480f-b6f9-298e05c9c6c3&width=48&height=48&sign=2c22e9ff&sv=2)Social accounts \| Blotato Helphelp.blotato.comchevron-right](https://help.blotato.com/settings/social-accounts)

* * *

## [hashtag](https://help.blotato.com/api/start\#id-3.-install-the-official-blotato-node)    3\. Install the Official Blotato Node

### [hashtag](https://help.blotato.com/api/start\#n8n)    n8n

1. Go to your n8n Admin Panel > Settings

2. Enable Verified Community Nodes

3. Open any workflow

4. Click the "+" icon in the top right corner

5. Search for "Blotato"

6. Click Install


For self-hosted n8n, see: [Self-Hosted n8n Usersarrow-up-right](https://help.blotato.com/api/n8n/n8n-blotato-node#self-hosted-n8n-users)

### [hashtag](https://help.blotato.com/api/start\#make)    Make

1. Open any scenario in Make

2. Click the "+" icon to add a module

3. Search for "Blotato"

4. Select the Blotato module


* * *

## [hashtag](https://help.blotato.com/api/start\#id-4.-setup-your-first-automation)    4\. Setup Your First Automation!

**New to building automations?** Start here:

- [Build Your First AI Automation](https://help.blotato.com/api/templates/11-build-your-first-ai-automation) \- Learn how to extract content from any source and publish to social media


Choose your preferred integration path:

- [MCP Server](https://help.blotato.com/api/mcp) \- control Blotato from Claude Desktop, Claude Code, or Cursor with natural language

- [n8n - post everywhere](https://help.blotato.com/api/templates/1-post-everywhere)

- [Make - post everywhere](https://help.blotato.com/api/templates/1-post-everywhere)

- [REST API - OpenAPI reference](https://help.blotato.com/api/openapi-reference) and [Examples Below](https://help.blotato.com/api/start#raw-rest-api-calls-examples)


Blotato has official Make.com and n8n nodes. Zapier coming soon!

Check out more workflow automation templates here:

[![Logo](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F208704740-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FdKnwL0PjrkkCOTNetB3Y%252Fsites%252Fsite_BrYWB%252Ficon%252F2EJYRAZoxTgN3UxIVtMn%252Fblotato-logo.png%3Falt%3Dmedia%26token%3D04bfc43a-c88e-480f-b6f9-298e05c9c6c3&width=48&height=48&sign=2c22e9ff&sv=2)Automation Templates \| Blotato Helphelp.blotato.comchevron-right](https://help.blotato.com/api/templates)

* * *

## [hashtag](https://help.blotato.com/api/start\#id-5.-troubleshoot-errors)    5\. Troubleshoot Errors

Use the API Dashboard and click on each request to see full payload, response, and error message:

**API Dashboard (for debugging):** [https://my.blotato.com/api-dashboardarrow-up-right](https://my.blotato.com/api-dashboard)

* * *

## [hashtag](https://help.blotato.com/api/start\#raw-rest-api-calls-examples)    Raw REST API Calls - Examples

### [hashtag](https://help.blotato.com/api/start\#authentication)    Authentication

To authenticate API requests, include your Blotato API key in the request headers.

**Authentication Header**

Copy

```
blotato-api-key: YOUR_API_KEY
```

Requests without a valid API key will be rejected and 401 error will be returned.

### [hashtag](https://help.blotato.com/api/start\#step-0-get-your-account-ids)    Step 0: Get Your Account IDs

Before publishing, fetch your connected accounts to get the `accountId`:

Copy

```
GET https://backend.blotato.com/v2/users/me/accounts HTTP/1.1
blotato-api-key: YOUR_API_KEY
```

Use the `id` from the response as your `accountId`. For Facebook and LinkedIn, also fetch subaccounts to get `pageId`. See [Accounts reference](https://help.blotato.com/api/accounts) for details.

### [hashtag](https://help.blotato.com/api/start\#post-to-a-platform-immediately)    Post to a Platform Immediately

Copy

```
POST https://backend.blotato.com/v2/posts HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "post": {
    "accountId": "98432",
    "content": {
      "text": "Hello, world!",
      "mediaUrls": [],
      "platform": "twitter"
    },
    "target": {
      "targetType": "twitter"
    }
  }
}
```

### [hashtag](https://help.blotato.com/api/start\#post-at-a-scheduled-time)    Post at a Scheduled Time

Copy

```
POST https://backend.blotato.com/v2/posts HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "post": {
    "accountId": "98432",
    "content": {
      "text": "Scheduled post example",
      "mediaUrls": [],
      "platform": "facebook"
    },
    "target": {
      "targetType": "facebook",
      "pageId": "987654321"
    }
  },
  "scheduledTime": "2025-03-10T15:30:00Z"
}
```

To schedule at the user's next available calendar slot instead of a specific time, replace `scheduledTime` with `useNextFreeSlot: true`. Both are top-level fields, not inside `post`. See [Publish Post](https://help.blotato.com/api/publish-post) for all scheduling options.

### [hashtag](https://help.blotato.com/api/start\#post-a-twitter-thread-with-multiple-posts)    Post a Twitter Thread with Multiple Posts

Copy

```
POST https://backend.blotato.com/v2/posts HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "post": {
    "accountId": "98432",
    "content": {
      "text": "This is the first tweet in the thread.",
      "mediaUrls": [],
      "platform": "twitter",
      "additionalPosts": [\
        {\
          "text": "Here's the second tweet, adding more info.",\
          "mediaUrls": []\
        },\
        {\
          "text": "And here's the third tweet to conclude!",\
          "mediaUrls": []\
        }\
      ]
    },
    "target": {
      "targetType": "twitter"
    }
  }
}
```

### [hashtag](https://help.blotato.com/api/start\#attach-media-to-post-images-and-videos)    Attach Media to Post (images and videos)

Pass any publicly accessible image/video URL into the `mediaUrls` parameter. No upload step required. Blotato handles the media transfer.

Copy

```
POST https://backend.blotato.com/v2/posts HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "post": {
    "accountId": "98432",
    "content": {
      "text": "Check out this image!",
      "mediaUrls": [\
        "https://example.com/image.jpg"\
      ],
      "platform": "instagram"
    },
    "target": {
      "targetType": "instagram"
    }
  }
}
```

The optional Upload Media endpoint is still available if you need to host media on Blotato's servers. See [Upload Media](https://help.blotato.com/api/publish-post/upload-media-v2-media).

* * *

## [hashtag](https://help.blotato.com/api/start\#for-ai-agents)    For AI Agents

If you are an AI agent or LLM integration, start with the plain-text API reference:

[API Reference for LLMs](https://help.blotato.com/api/llm)

This contains the full API specification in a format optimized for LLMs, including all endpoints, parameters, status values, and a complete workflow pseudocode.

For async workflow patterns and code examples, see [Protocol and Recipes](https://help.blotato.com/api/workflows).

For the full endpoint reference, see [API Referencearrow-up-right](https://github.com/Blotato-Inc/help.blotato.com/blob/main/api/api-reference/README.md).

[PreviousFAQschevron-left](https://help.blotato.com/support/faqs) [NextAPI Reference for LLMschevron-right](https://help.blotato.com/api/llm)

Last updated 1 month ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# API Reference for LLMs | Blotato Help
URL: https://help.blotato.com/api/llm

This is the machine-readable API reference for AI agents and LLM integrations.

Copy

```
BLOTATO API REFERENCE
=====================

Base URL: https://backend.blotato.com/v2
Auth Header: blotato-api-key: YOUR_API_KEY
Content-Type: application/json

All creation operations are ASYNC. Submit a request, then poll for status.

Docs: https://help.blotato.com/api/start
OpenAPI: https://help.blotato.com/api/api-reference/openapi-reference
Errors: https://help.blotato.com/support/errors

================================================================================
ENDPOINTS
================================================================================

USER INFO & CONNECTED ACCOUNTS (all under /users/me/)
  GET  /users/me              - Verify API key, get user info
  GET  /users/me/accounts     - List connected social accounts (get accountId)
  GET  /users/me/accounts/:accountId/subaccounts - Get Facebook/LinkedIn pageId

PUBLISHING
  POST /posts                 - Create/publish a post (30 req/min)
  GET  /posts/:postSubmissionId - Poll post status (60 req/min)

VISUALS
  POST /videos/from-templates - Create visual from template (30 req/min)
  GET  /videos/creations/:id  - Poll visual status
  GET  /videos/templates      - List available templates
  DELETE /videos/:id          - Delete a video

SOURCES (Content Extraction)
  POST /source-resolutions-v3 - Extract content from URL/text (30 req/min)
  GET  /source-resolutions-v3/:id - Poll source status (60 req/min)

MEDIA
  POST /media                 - Upload media from URL (30 req/min, optional)

================================================================================
STEP 0: GET ACCOUNTS (always do this first)
================================================================================

GET /users/me/accounts
GET /users/me/accounts?platform=twitter  (filter by platform)

Response:
{
  "items": [\
    { "id": "98432", "platform": "twitter", "fullname": "Jane", "username": "jane" }\
  ]
}

For Facebook/LinkedIn, also fetch subaccounts to get pageId:
GET /users/me/accounts/98432/subaccounts

Response:
{
  "items": [\
    { "id": "123456789", "accountId": "98432", "name": "My Business Page" }\
  ]
}

Use items[].id as target.pageId when publishing to Facebook or LinkedIn.

Pinterest boardId is not available via API. Ask the user for it.

================================================================================
PUBLISHING A POST
================================================================================

POST /posts

Minimal payload (Twitter):
{
  "post": {
    "accountId": "98432",
    "content": {
      "text": "Hello world",
      "mediaUrls": [],
      "platform": "twitter"
    },
    "target": {
      "targetType": "twitter"
    }
  }
}

RULES:
- content.platform and target.targetType must be set to the same value
- mediaUrls is required. Pass [] for text-only posts. Pass public URLs for media.
- accountId comes from GET /users/me/accounts
- No upload step needed. Pass any public URL in mediaUrls.

SCHEDULING (optional, top-level fields alongside "post"):
- scheduledTime: ISO 8601 timestamp with timezone offset (e.g., "2026-03-04T16:30:00+00:00") to publish at a specific time. If provided, useNextFreeSlot is ignored.
- useNextFreeSlot: true to schedule at the user's next available calendar slot. Requires at least one calendar slot configured for the target platform.
- If NEITHER scheduledTime NOR useNextFreeSlot is provided, the post PUBLISHES IMMEDIATELY.
- Both fields MUST be root-level (siblings of "post"). If nested inside "post", "options", or any other object, they are IGNORED and the post publishes immediately.

Publish immediately (no scheduling fields):
{
  "post": { "accountId": "98432", "content": {...}, "target": {...} }
}

Schedule at user's next free calendar slot:
{
  "post": { "accountId": "98432", "content": {...}, "target": {...} },
  "useNextFreeSlot": true
}

Schedule at a specific time:
{
  "post": { "accountId": "98432", "content": {...}, "target": {...} },
  "scheduledTime": "2025-12-25T15:00:00Z"
}

WRONG (do NOT nest scheduling fields inside "post" or "options"):
{
  "post": { "accountId": "98432", "content": {...}, "target": {...}, "useNextFreeSlot": true }
}
{
  "post": { "accountId": "98432", "content": {...}, "target": {...} },
  "options": { "scheduledTime": "2026-03-04T16:30:00+00:00" }
}

THREADS (Twitter, Bluesky, Threads):
Use content.additionalPosts[] to create a thread in a single API call.
The first tweet goes in content.text. Additional tweets go in additionalPosts[].

{
  "post": {
    "accountId": "98432",
    "content": {
      "text": "First tweet in the thread (1/3)",
      "mediaUrls": [],
      "platform": "twitter",
      "additionalPosts": [\
        { "text": "Second tweet (2/3)", "mediaUrls": [] },\
        { "text": "Third tweet (3/3)", "mediaUrls": [] }\
      ]
    },
    "target": { "targetType": "twitter" }
  }
}

Each additionalPosts[] entry has: text (string), mediaUrls (array of strings).
Blotato handles reply chaining. You do NOT need to capture tweet IDs.
Works for: twitter, bluesky, threads.

PLATFORM-SPECIFIC TARGET FIELDS (set these inside "target" alongside "targetType"):

twitter:
  (no extra fields required)

linkedin:
  pageId (optional) - LinkedIn Company Page ID from subaccounts endpoint. Omit for personal profile.

facebook:
  pageId (REQUIRED) - from GET /users/me/accounts/{accountId}/subaccounts
  mediaType (optional) - "video" or "reel"
  link (optional) - URL to attach as link preview

instagram:
  mediaType (optional) - "reel" or "story". Default: "reel". No effect on image posts.
  altText (optional) - alt text for images, up to 1000 characters
  collaborators (optional) - array of Instagram handles (without @), max 3
  coverImageUrl (optional) - cover image URL for reels, max 8MB
  shareToFeed (optional) - boolean, share the reel to feed
  audioName (optional) - custom audio name for reels (can only set once)

tiktok (ALL of these are REQUIRED):
  privacyLevel - "SELF_ONLY", "PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "FOLLOWER_OF_CREATOR"
  disabledComments - boolean
  disabledDuet - boolean
  disabledStitch - boolean
  isBrandedContent - boolean
  isYourBrand - boolean
  isAiGenerated - boolean
  (optional) title - for image posts, max 90 chars
  (optional) autoAddMusic - boolean, for photo posts only
  (optional) isDraft - boolean, save as draft
  (optional) imageCoverIndex - number, cover image index for carousels (starts from 0)
  (optional) videoCoverTimestamp - number, milliseconds for video cover frame

pinterest:
  boardId (REQUIRED) - not available via API, ask the user
  title (optional)
  altText (optional)
  link (optional)

threads:
  replyControl (optional) - "everyone", "accounts_you_follow", "mentioned_only"

bluesky:
  (no extra fields required)

youtube:
  title (REQUIRED) - video title
  privacyStatus (REQUIRED) - "private", "public", "unlisted"
  shouldNotifySubscribers (REQUIRED) - boolean
  isMadeForKids (optional) - boolean, default false
  containsSyntheticMedia (optional) - boolean, for AI-generated content

webhook:
  url (REQUIRED) - the webhook URL

Response: { "postSubmissionId": "uuid" }

Poll: GET /posts/{postSubmissionId}
Status values: "in-progress" | "published" | "failed"
- published: response includes "publicUrl"
- failed: response includes "errorMessage"

================================================================================
CREATING VISUALS
================================================================================

POST /videos/from-templates

RECOMMENDED: Use "prompt" to describe what you want. Set "inputs" to {}.
AI fills in the template inputs automatically from your prompt.
Do NOT manually construct the "inputs" object unless you have a specific reason.

templateId: Use the bare UUID from the templates list (e.g., "77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd").
Do NOT use the full path format (e.g., "/base/v2/quote-card/.../v1").

CORRECT:
{
  "templateId": "77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd",
  "inputs": {},
  "prompt": "Create 5 motivational quotes about entrepreneurship",
  "render": true
}

WRONG (do not manually fill inputs, use prompt instead):
{
  "templateId": "77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd",
  "inputs": { "text": "Slide 1: ..." },
  "render": true
}

Response: { "item": { "id": "vid_123", "status": "queueing" } }

Poll: GET /videos/creations/{id}
Status values: "queueing" | "generating-script" | "script-ready" |
               "generating-media" | "media-ready" | "exporting" |
               "done" | "creation-from-template-failed"

Terminal states: "done" (success) or "creation-from-template-failed" (failure)
When done: response includes "mediaUrl" and/or "imageUrls"

Use mediaUrl or imageUrls in your publish request's mediaUrls field.

Discover templates: GET /videos/templates?fields=id,name,description,inputs
Template reference: https://help.blotato.com/api/visuals

================================================================================
EXTRACTING CONTENT (SOURCES)
================================================================================

POST /source-resolutions-v3

Body MUST contain a "source" object. Do NOT put fields at the top level.

source.sourceType (REQUIRED, no auto-detection):
- "text"             - Transform raw text (uses source.text)
- "article"          - Extract from article URL (uses source.url)
- "youtube"          - Extract from YouTube URL (uses source.url)
- "twitter"          - Extract from Twitter/X URL (uses source.url)
- "tiktok"           - Extract from TikTok URL (uses source.url)
- "perplexity-query" - AI web research (uses source.text)
- "audio"            - Extract from audio URL (uses source.url)
- "pdf"              - Extract from PDF URL (uses source.url)

CORRECT:
{
  "source": {
    "sourceType": "youtube",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
}

WRONG (missing "source" wrapper):
{ "sourceType": "youtube", "url": "..." }

Response: { "id": "src_123" }

Poll: GET /source-resolutions-v3/{id}
Status values: "queued" | "processing" | "completed" | "failed"
When completed: response includes "content" and "title"

================================================================================
COMPLETE WORKFLOW (for AI agents)
================================================================================

1. accounts = GET /users/me/accounts
   For Facebook or LinkedIn: also GET /users/me/accounts/{accountId}/subaccounts
   Use subaccount id as target.pageId (REQUIRED for Facebook, optional for LinkedIn)
2. sourceId = POST /source-resolutions-v3 { source: { sourceType, url/text } }
3. POLL: GET /source-resolutions-v3/{sourceId} until status = "completed"
4. videoId = POST /videos/from-templates { templateId, prompt, render: true }
5. POLL: GET /videos/creations/{videoId} until status = "done"
6. postId = POST /posts { post: { accountId, content, target }, scheduledTime?: "ISO8601" }
   scheduledTime and useNextFreeSlot go OUTSIDE "post", at the root level.
   Omit both to publish immediately.
7. POLL: GET /posts/{postId} until status = "published"
8. DONE: use publicUrl from step 7

================================================================================
RATE LIMITS
================================================================================

POST /posts:                    30 requests / minute
GET  /posts/:id:                60 requests / minute
POST /videos/from-templates:    30 requests / minute
POST /source-resolutions-v3:    30 requests / minute
GET  /source-resolutions-v3/:id: 60 requests / minute
POST /media:                    30 requests / minute
GET  /users/me/accounts:        No limit
GET  /users/me:                 No limit

429 response means rate limit exceeded. Check "message" for retry timing.

================================================================================
COMMON MISTAKES
================================================================================

1. Scheduling fields nested inside "post":
   scheduledTime and useNextFreeSlot are ROOT-LEVEL fields, siblings of "post".
   WRONG: { "post": { ..., "scheduledTime": "2025-12-25T15:00:00Z" } }
   RIGHT: { "post": { ... }, "scheduledTime": "2025-12-25T15:00:00Z" }
   If nested inside "post", the post publishes immediately instead of scheduling.

2. Missing pageId for Facebook:
   Facebook REQUIRES target.pageId. You must call GET /users/me/accounts/{accountId}/subaccounts
   to get the pageId before publishing. Without it, the request fails.

3. content.platform and target.targetType mismatch:
   These two fields must have the same value (e.g., both "twitter").

4. Using template path instead of UUID for templateId:
   WRONG: "templateId": "/base/v2/quote-card/.../v1"
   RIGHT: "templateId": "77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd"

5. Manually filling template inputs instead of using prompt:
   Set "inputs": {} and describe what you want in "prompt". AI fills the inputs.

6. Wrong accounts endpoint path:
   WRONG: GET /accounts or GET /v2/accounts
   RIGHT: GET /users/me/accounts
   There is no /accounts endpoint. Always use the full path /users/me/accounts.
```

[PreviousAPI Quickstartchevron-left](https://help.blotato.com/api/start) [NextWorkflowschevron-right](https://help.blotato.com/api/workflows)

Last updated 17 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Automation Templates | Blotato Help
URL: https://help.blotato.com/api/templates

Title

11 Build Your First AI Automation

Description

The best starting point for anyone new to building automations. Learn how to extract content from YouTube, TikTok, articles, or PDFs using the Source nodes, then publish to social media.

![Cover](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252F0CX85EJZtyWv113CAbZE%252FScreenshot%25202025-08-25%2520at%252012.00.54%25E2%2580%25AFPM.png%3Falt%3Dmedia%26token%3D5169a259-75ec-4656-8c95-f6d7aac0c782&width=490&dpr=3&quality=100&sign=a9509d0b&sv=2)

Title

1 Post Everywhere

Description

This automation publishes to 9 social platforms daily! Manage your content in a simple Google Sheet. When you set a post's status to "Ready to Post" in your Google Sheet, this workflow grabs your image/video from your Google Drive, posts your content to 9 social platforms, then updates the Google Sheet post status to "Posted".

![Cover](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252Fb4CgeMcRjRJrBAHeAxYY%252FScreenshot%25202025-09-05%2520at%252010.28.37%25E2%2580%25AFAM.png%3Falt%3Dmedia%26token%3D7561cfa1-76bc-462b-942e-fe35a6676ce9&width=490&dpr=3&quality=100&sign=43ebfcf1&sv=2)

Title

2 Email to Long-Form Thread

Description

Send an email to yourself with a rough idea you want to post about, then ChatGPT will clean it up, apply a viral thread template, and Blotato will post it on your socials as a long-form thread.

![Cover](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252FPtkDAncwAI9uU0LdlVh4%252FScreenshot%25202025-09-05%2520at%252010.30.23%25E2%2580%25AFAM.png%3Falt%3Dmedia%26token%3D5b94ea9e-5fe8-4fd2-abef-36e978315e83&width=490&dpr=3&quality=100&sign=19d60e21&sv=2)

Title

Hackernews to AI Clone Videos

Description

This fully automated AI Avatar Social Media system that creates talking head AI clone videos, WITHOUT having to film or edit yourself. It combines n8n, AI agent, HeyGen, and Blotato to research, create, and distribute talking head AI clone videos to every social media platform every single day.

![Cover](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252FpT7GSMVyq9PMCh086sva%252FScreenshot%25202025-09-06%2520at%25201.14.50%25E2%2580%25AFPM.png%3Falt%3Dmedia%26token%3D6c0bcd90-50c7-4f8b-8c37-952d9c84ea27&width=490&dpr=3&quality=100&sign=6098441e&sv=2)

Title

4 Viral News to AI Avatar Videos

Description

This fully automated AI Avatar Viral News system researches the latest trending news in your niche or industry, then generates talking head AI clone videos, WITHOUT having to film or edit yourself. It combines ChatGPT, Perplexity, HeyGen, and Blotato to research, create, and auto-post talking head AI avatar videos to every social media platform, every single day.

![Cover](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252F8PdP4AHthNesyUAQe7m5%252FScreenshot%25202025-09-13%2520at%252010.19.31%25E2%2580%25AFAM.png%3Falt%3Dmedia%26token%3D0857ff69-2e9b-4b04-b1a5-ecc1457fa0da&width=490&dpr=3&quality=100&sign=8774e33&sv=2)

Title

5 Automate Instagram Carousels with AI Chat

Description

This AI Agent Carousel Maker uses ChatGPT and Blotato to write, generate, and auto-post social media carousels to 5 social platforms: Instagram, Tiktok, Facebook, Twitter, and Pinterest. Simply chat with the AI agent, confirm which prebuilt viral carousel template you want to use, then the AI Agent populates the template with your personalized information and quotes, and posts to social media on autopilot.

![Cover](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252FQkiJQPt7UBF3VxpiT0Ng%252FScreenshot%25202025-10-08%2520at%252011.22.19%25E2%2580%25AFAM.png%3Falt%3Dmedia%26token%3Da4279727-c9f9-4fc9-a3d1-ab8b13a5be06&width=490&dpr=3&quality=100&sign=211a9e35&sv=2)

Title

7 Clone Viral Reels with AI Avatar

Description

Clone viral Instagram Reels into your own branded AI avatar video, WITHOUT having to film or edit yourself. It combines content analysis, script rewriting, and HeyGen AI avatars to download reels, write scripts tailored to your industry / use case, and captions into a short 30-second format, regenerate the video with your chosen avatar and voice, and automatically post across every major social media platform.

![Cover](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252FwriEtCpbOX9qplvnxd3H%252FScreenshot%25202025-10-15%2520at%252012.01.58%25E2%2580%25AFPM.png%3Falt%3Dmedia%26token%3D1797c2ed-e43e-469f-b981-ea1ddb720dcc&width=490&dpr=3&quality=100&sign=de4c7d6b&sv=2)

Title

8 Repurpose Tiktoks On Autopilot

Description

This automation detects when you post a Tiktok video, automatically downloads the video without watermark, stores it in Google Drive, and reposts your Tiktok video to other social media platforms. All on autopilot. So you can grow your presence on multiple platforms, without more work.

![Cover](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252FBBKYfaZwXWL0bBObQWak%252FScreenshot%25202025-11-03%2520at%25206.04.03%25E2%2580%25AFPM.png%3Falt%3Dmedia%26token%3D260dd063-c3ee-413e-b1e8-c038f35806e5&width=490&dpr=3&quality=100&sign=982a4473&sv=2)

Title

9 Repurpose Tiktoks into Carousels and Threads

Description

This automation detects when you post a Tiktok video, automatically downloads the video without watermark, stores it in Google Drive, and reposts your Tiktok video to other social media platforms, including converting it into a carousel for Instagram and a long-form thread for X/Twitter, Bluesky, and Threads. There is also a human-in-the-loop email approval step before reposting to Linkedin..

![Cover](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252FTTnWGX0vrviV8u7fORmh%252FYT%2520Thumbnails%2520%281%29.png%3Falt%3Dmedia%26token%3Dd7c52d53-78ad-4c84-891b-99f6e3ebe994&width=490&dpr=3&quality=100&sign=4b9b69c9&sv=2)

Title

10 Gamma Templates

Description

You can now use [Gammaarrow-up-right](https://gamma.app/) to create presentations and social media carousels, using your own custom branded template, then post them automatically on social media!

[PreviousGet Sourcechevron-left](https://help.blotato.com/api/create-source/get-source) [Next11 Build Your First AI Automationchevron-right](https://help.blotato.com/api/templates/11-build-your-first-ai-automation)

Last updated 1 month ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Visual Templates | Blotato Help
URL: https://help.blotato.com/api/visuals

Create images and videos using pre-built templates with the [Create Visual API endpoint](https://help.blotato.com/api/create-video).

## [hashtag](https://help.blotato.com/api/visuals\#how-to-use-templates)    How to Use Templates

1. Choose a template from the categories below

2. Copy the UUID from the template ID (e.g., from `/base/v2/quote-card/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd/v1`, use `77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd`)

3. Send a POST request to `/v2/videos/from-templates` with the UUID as `templateId`, set `inputs` to `{}`, and describe what you want in `prompt`


### [hashtag](https://help.blotato.com/api/visuals\#example-request)    Example Request

Use the `prompt` parameter to describe what you want. Set `inputs` to `{}`. AI fills in the template inputs automatically.

Use the bare UUID as the `templateId` (not the full path).

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd",
  "inputs": {},
  "prompt": "Create 5 motivational quotes about entrepreneurship",
  "render": true
}
```

### [hashtag](https://help.blotato.com/api/visuals\#llm-friendly-reference)    LLM-Friendly Reference

For LLM integrations, see [API Reference for LLMs](https://help.blotato.com/api/llm) for a plain text reference with all endpoints and parameters.

* * *

## [hashtag](https://help.blotato.com/api/visuals\#image-slideshows)    Image Slideshows

Create image slideshows with text overlays. Images uploaded or AI-generated.

Template

ID

Output

[Image Slideshow with Text Overlays](https://help.blotato.com/api/visuals/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f)

`/base/v2/image-slideshow/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f/v1`

Slideshow

* * *

## [hashtag](https://help.blotato.com/api/visuals\#quote-cards)    Quote Cards

Quote card carousels with various background styles.

Template

ID

Output

[Quote Card with Monocolor Background](https://help.blotato.com/api/visuals/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd)

`/base/v2/quote-card/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd/v1`

Slideshow

[Quote Card with Paper Background and Highlight](https://help.blotato.com/api/visuals/f941e306-76f7-45da-b3d9-7463af630e91)

`/base/v2/quote-card/f941e306-76f7-45da-b3d9-7463af630e91/v1`

Slideshow

* * *

## [hashtag](https://help.blotato.com/api/visuals\#tweet-cards)    Tweet Cards

Twitter/X-style quote cards with minimal or photo/video backgrounds.

Template

ID

Output

[Tweet Card with Minimal Style](https://help.blotato.com/api/visuals/ba413be6-a840-4e60-8fd6-0066d3b427df)

`/base/v2/tweet-card/ba413be6-a840-4e60-8fd6-0066d3b427df/v1`

Slideshow

[Tweet Card with Photo/Video Background](https://help.blotato.com/api/visuals/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66)

`/base/v2/tweet-card/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66/v1`

Slideshow

* * *

## [hashtag](https://help.blotato.com/api/visuals\#tutorial-carousels)    Tutorial Carousels

Step-by-step tutorial visuals with customizable styling.

Template

ID

Output

[Tutorial Carousel with Minimalist Flat Style](https://help.blotato.com/api/visuals/2491f97b-1b47-4efa-8b96-8c651fa7b3d5)

`/base/v2/tutorial-carousel/2491f97b-1b47-4efa-8b96-8c651fa7b3d5/v1`

Slideshow

[Tutorial Carousel with Monocolor Background](https://help.blotato.com/api/visuals/e095104b-e6c5-4a81-a89d-b0df3d7c5baf)

`/base/v2/tutorial-carousel/e095104b-e6c5-4a81-a89d-b0df3d7c5baf/v1`

Slideshow

* * *

## [hashtag](https://help.blotato.com/api/visuals\#images-with-text)    Images with Text

Combine images and text overlays in various styles.

Template

ID

Output

[Image Slideshow with Prominent Text](https://help.blotato.com/api/visuals/0ddb8655-c3da-43da-9f7d-be1915ca7818)

`/base/v2/images-with-text/0ddb8655-c3da-43da-9f7d-be1915ca7818/v1`

Slideshow

[When X then Y Text Slideshow](https://help.blotato.com/api/visuals/c9892c3b-fa75-4ade-821a-a50ff8456230)

`/base/v2/images-with-text/c9892c3b-fa75-4ade-821a-a50ff8456230/v1`

Video

[Video of Images and Text with Minimal Style](https://help.blotato.com/api/visuals/3ed4bb92-dbfe-45e6-9dc8-605b77f70506)

`/base/v2/images-with-text/3ed4bb92-dbfe-45e6-9dc8-605b77f70506/v1`

Video

* * *

## [hashtag](https://help.blotato.com/api/visuals\#video-editor)    Video Editor

Combine and edit video clips with titles, captions, and music.

Template

ID

Output

[Combine Clips and Apply Basic Edits](https://help.blotato.com/api/visuals/c306ae43-1dcc-4f45-ac2b-88e75430ffd8)

`/base/v2/combine-clips/c306ae43-1dcc-4f45-ac2b-88e75430ffd8/v1`

Video

* * *

## [hashtag](https://help.blotato.com/api/visuals\#ai-videos)    AI Videos

AI-powered video generation with voiceovers and narration.

Template

ID

Output

[AI Video with AI Voice](https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd)

`/base/v2/ai-story-video/5903fe43-514d-40ee-a060-0d6628c5f8fd/v1`

Video

[AI Selfie Talking Video with Consistent Character](https://help.blotato.com/api/visuals/57f5a565-fd17-458b-be43-4a2d8ccaca75)

`/base/v2/ai-selfie-video/57f5a565-fd17-458b-be43-4a2d8ccaca75/v1`

Video

* * *

## [hashtag](https://help.blotato.com/api/visuals\#ai-avatar)    AI Avatar

AI avatar videos with generated B-roll footage.

Template

ID

Output

[AI Avatar with AI Generated B-roll](https://help.blotato.com/api/visuals/7c26a1cd-d5b3-42da-9c73-2413333873b3)

`/base/v2/ai-avatar-broll/7c26a1cd-d5b3-42da-9c73-2413333873b3/v1`

Video

* * *

## [hashtag](https://help.blotato.com/api/visuals\#ai-generated-infographics-v1-legacy)    AI-Generated Infographics (V1 Legacy)

AI-powered infographic templates that generate single images based on text descriptions. Each template applies a unique visual style to your content.

### [hashtag](https://help.blotato.com/api/visuals\#news-and-media)    News and Media

Template

ID

Output

[TV Wall Infographic](https://help.blotato.com/api/visuals/013904bf-6b3b-43f4-bb1f-f1964a38c29b)

`/video-template/013904bf-6b3b-43f4-bb1f-f1964a38c29b`

Image

[Newspaper Infographic](https://help.blotato.com/api/visuals/07a5b5c5-387c-49e3-86b1-de822cd2dfc7)

`/video-template/07a5b5c5-387c-49e3-86b1-de822cd2dfc7`

Image

[Breaking News](https://help.blotato.com/api/visuals/8800be71-52df-4ac7-ac94-df9d8a494d0f)

`/video-template/8800be71-52df-4ac7-ac94-df9d8a494d0f`

Image

[Movie Theater Infographic](https://help.blotato.com/api/visuals/b88c8273-6406-48c6-85e7-096119aefe30)

`/video-template/b88c8273-6406-48c6-85e7-096119aefe30`

Image

### [hashtag](https://help.blotato.com/api/visuals\#urban-and-street)    Urban and Street

Template

ID

Output

[Graffiti Mural Infographic](https://help.blotato.com/api/visuals/3598483b-c148-4276-a800-eede85c1c62f)

`/video-template/3598483b-c148-4276-a800-eede85c1c62f`

Image

[Bus Ad Infographic](https://help.blotato.com/api/visuals/f9c0e470-9288-4958-8cdd-64772ed93c05)

`/video-template/f9c0e470-9288-4958-8cdd-64772ed93c05`

Image

[Billboard Infographic](https://help.blotato.com/api/visuals/76b3b959-bdbe-440d-8428-984219353f18)

`/video-template/76b3b959-bdbe-440d-8428-984219353f18`

Image

### [hashtag](https://help.blotato.com/api/visuals\#education)    Education

Template

ID

Output

[Classroom Chalkboard Infographic](https://help.blotato.com/api/visuals/d9495026-3945-44f6-8b44-07c28c492e6d)

`/video-template/d9495026-3945-44f6-8b44-07c28c492e6d`

Image

[Whiteboard Infographic](https://help.blotato.com/api/visuals/ae868019-820d-434c-8fe1-74c9da99129a)

`/video-template/ae868019-820d-434c-8fe1-74c9da99129a`

Image

[Chalkboard Infographic](https://help.blotato.com/api/visuals/fcd64907-b103-46f8-9f75-51b9d1a522f5)

`/video-template/fcd64907-b103-46f8-9f75-51b9d1a522f5`

Image

### [hashtag](https://help.blotato.com/api/visuals\#outdoor)    Outdoor

Template

ID

Output

[Trail Marker Infographic](https://help.blotato.com/api/visuals/29ebb2bd-02b7-4317-8bb8-c30eb938e47c)

`/video-template/29ebb2bd-02b7-4317-8bb8-c30eb938e47c`

Image

[Constellation Infographic](https://help.blotato.com/api/visuals/5307053e-046b-4c9b-b1ca-38725d2ddcdd)

`/video-template/5307053e-046b-4c9b-b1ca-38725d2ddcdd`

Image

### [hashtag](https://help.blotato.com/api/visuals\#creative)    Creative

Template

ID

Output

[Manga Panel Infographic](https://help.blotato.com/api/visuals/49c61370-a706-4b82-98f7-62d557d1c66d)

`/video-template/49c61370-a706-4b82-98f7-62d557d1c66d`

Image

[T-Shirt Infographic](https://help.blotato.com/api/visuals/476f8920-8749-4ff7-9c91-470d54c3c03e)

`/video-template/476f8920-8749-4ff7-9c91-470d54c3c03e`

Image

[Futuristic Flyer](https://help.blotato.com/api/visuals/8fa8545e-8955-4a89-a868-cf45023d6cc5)

`/video-template/8fa8545e-8955-4a89-a868-cf45023d6cc5`

Image

[Book Page Infographic](https://help.blotato.com/api/visuals/f8f1ebe4-a9f5-4ec8-be63-21214656cd4b)

`/video-template/f8f1ebe4-a9f5-4ec8-be63-21214656cd4b`

Image

[Single Centered Text Quote](https://help.blotato.com/api/visuals/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0)

`/video-template/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0`

Slideshow

### [hashtag](https://help.blotato.com/api/visuals\#tech)    Tech

Template

ID

Output

[Steampunk Infographic](https://help.blotato.com/api/visuals/7b7104f1-d277-4993-ad3a-e5883c4b776d)

`/video-template/7b7104f1-d277-4993-ad3a-e5883c4b776d`

Image

[Top Secret Infographic](https://help.blotato.com/api/visuals/b8707b58-a106-44af-bb12-e30507e561af)

`/video-template/b8707b58-a106-44af-bb12-e30507e561af`

Image

### [hashtag](https://help.blotato.com/api/visuals\#historical)    Historical

Template

ID

Output

[Egyptian Hieroglyph Infographic](https://help.blotato.com/api/visuals/a7b0d128-8478-4b34-9647-a0778b6517d0)

`/video-template/a7b0d128-8478-4b34-9647-a0778b6517d0`

Image

[Cave Painting Infographic](https://help.blotato.com/api/visuals/82ee75b6-597b-43a8-86bc-e4395e7c9c44)

`/video-template/82ee75b6-597b-43a8-86bc-e4395e7c9c44`

Image

* * *

## [hashtag](https://help.blotato.com/api/visuals\#dont-see-a-template-for-your-use-case)    Don't See a Template for Your Use Case?

Submit a support ticket and describe the type of visual you need. To submit a ticket, click the orange circle button inside Blotato.

Include the following in your request:

- A description of the visual format you need (e.g., "listicle carousel with numbered items")

- The platform you plan to post on (e.g., Instagram, TikTok, LinkedIn)

- A link to an example of the format, if available


* * *

## [hashtag](https://help.blotato.com/api/visuals\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [Get Visual Status API Reference](https://help.blotato.com/api/create-video/find-video)

- [Media Requirementsarrow-up-right](https://github.com/Blotato-Inc/help.blotato.com/blob/main/api/media.md)


[PreviousDelete Videochevron-left](https://help.blotato.com/api/create-video/delete-video) [NextImage Slideshow with Text Overlayschevron-right](https://help.blotato.com/api/visuals/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f)

Last updated 28 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Post | Blotato Help
URL: https://help.blotato.com/api/publish-post

## [hashtag](https://help.blotato.com/api/publish-post\#publishing-a-post)    Publishing a Post

### [hashtag](https://help.blotato.com/api/publish-post\#endpoint)    Endpoint

**Base URL:**`https://backend.blotato.com/v2`

**URL:**`/posts`

**Method:**`POST`

**Rate Limit:** 30 requests / minute

### [hashtag](https://help.blotato.com/api/publish-post\#description)    Description

Publish a new post to a social media platform. The request must include the post content, target platform, and an `accountId` (fetched from `GET /v2/users/me/accounts`).

After submitting, poll [Get Post Status](https://help.blotato.com/api/publish-post/get-post) with the returned `postSubmissionId` to track publishing progress.

### [hashtag](https://help.blotato.com/api/publish-post\#before-you-start)    Before You Start

1. Fetch your connected accounts: `GET /v2/users/me/accounts` ( [docs](https://help.blotato.com/api/accounts))

2. For Facebook/LinkedIn, fetch subaccounts to get `pageId`: `GET /v2/users/me/accounts/{accountId}/subaccounts` ( [docs](https://help.blotato.com/api/accounts#list-subaccounts-pages))

3. Set `content.platform` and `target.targetType` to the same platform value (e.g., both `"twitter"`)


* * *

### [hashtag](https://help.blotato.com/api/publish-post\#request-body)    Request Body

The request body has two top-level fields: `post` (required) and optional scheduling fields. Do not nest scheduling fields inside `post`.

Field

Type

Required

Description

`post`

`object`

Yes

The post content and metadata.

`scheduledTime`

`string`

No

ISO 8601 timestamp with timezone offset (e.g., `2026-03-04T16:30:00+00:00`). If provided, `useNextFreeSlot` is ignored.

`useNextFreeSlot`

`boolean`

No

Schedule at the next available slot time. Defaults to `false`. Requires at least one calendar slot configured for the target platform.

**Scheduling behavior:**

- If `scheduledTime` is set: the post is scheduled for that time. `useNextFreeSlot` is ignored.

- If `useNextFreeSlot` is `true` (and no `scheduledTime`): the post is scheduled at the next available calendar slot for that platform.

- If neither `scheduledTime` nor `useNextFreeSlot` is provided: **the post publishes immediately.**

- Both fields must be **root-level** (siblings of `post`). If they are nested inside `post`, `options`, or any other object, they are ignored and the post publishes immediately.


### [hashtag](https://help.blotato.com/api/publish-post\#post-object)    `post` Object

Field

Type

Required

Description

`accountId`

`string`

Yes

The account ID from `GET /v2/users/me/accounts`.

`content`

`object`

Yes

The content of the post. See `content` below.

`target`

`object`

Yes

The target platform and platform-specific fields. See `target` below.

### [hashtag](https://help.blotato.com/api/publish-post\#content-object)    `content` Object

Field

Type

Required

Description

`text`

`string`

Yes

The text content of the post.

`mediaUrls`

`array of strings`

Yes

Array of media URLs. Pass any publicly accessible URL -- no upload step required. Pass `[]` for text-only posts.

`platform`

`string`

Yes

Must match `target.targetType`. Values: `twitter`, `linkedin`, `facebook`, `instagram`, `pinterest`, `tiktok`, `threads`, `bluesky`, `youtube`, `other`

`additionalPosts`

`array`

No

Additional posts for threads (Twitter, Bluesky, Threads). Each has `text` and `mediaUrls`.

### [hashtag](https://help.blotato.com/api/publish-post\#target-object)    `target` Object

The `target` object requires `targetType` and platform-specific fields. Set `targetType` to match `content.platform`.

#### [hashtag](https://help.blotato.com/api/publish-post\#quick-reference-required-fields-per-platform)    Quick Reference: Required Fields Per Platform

Platform

`targetType`

Required Fields

Optional Fields

Twitter

`"twitter"`

(none)

(none)

LinkedIn

`"linkedin"`

(none)

`pageId`

Facebook

`"facebook"`

`pageId`

`mediaType`, `link`

Instagram

`"instagram"`

(none)

`mediaType`, `altText`, `collaborators`, `coverImageUrl`, `shareToFeed`, `audioName`

TikTok

`"tiktok"`

`privacyLevel`, `disabledComments`, `disabledDuet`, `disabledStitch`, `isBrandedContent`, `isYourBrand`, `isAiGenerated`

`title`, `autoAddMusic`, `isDraft`, `imageCoverIndex`, `videoCoverTimestamp`

Pinterest

`"pinterest"`

`boardId`

`title`, `altText`, `link`

Threads

`"threads"`

(none)

`replyControl`

Bluesky

`"bluesky"`

(none)

(none)

YouTube

`"youtube"`

`title`, `privacyStatus`, `shouldNotifySubscribers`

`isMadeForKids`, `containsSyntheticMedia`

Webhook

`"webhook"`

`url`

(none)

* * *

#### [hashtag](https://help.blotato.com/api/publish-post\#twitter)    Twitter

Field

Type

Required

`targetType`

`"twitter"`

Yes

#### [hashtag](https://help.blotato.com/api/publish-post\#linkedin)    LinkedIn

Field

Type

Required

Description

`targetType`

`"linkedin"`

Yes

`pageId`

`string`

No

LinkedIn Company Page ID from [subaccounts](https://help.blotato.com/api/accounts#list-subaccounts-pages). Omit to post to personal profile.

#### [hashtag](https://help.blotato.com/api/publish-post\#facebook)    Facebook

Field

Type

Required

Description

`targetType`

`"facebook"`

Yes

`pageId`

`string`

Yes

Facebook Page ID from [subaccounts](https://help.blotato.com/api/accounts#list-subaccounts-pages).

`mediaType`

`"video"` or `"reel"`

No

How to upload videos. Only applies when `mediaUrls` contains a video.

`link`

`string`

No

URL to attach as a link preview.

#### [hashtag](https://help.blotato.com/api/publish-post\#instagram)    Instagram

Field

Type

Required

Description

`targetType`

`"instagram"`

Yes

`mediaType`

`"reel"` or `"story"`

No

Default: `"reel"`. Has no effect on image posts.

`altText`

`string`

No

Alt text for images. Up to 1000 characters.

`collaborators`

`array of strings`

No

Instagram handles to tag (max 3). Do not include the @ sign.

`coverImageUrl`

`string`

No

Cover image URL for reels. Max 8MB.

`shareToFeed`

`boolean`

No

Share the reel to the Instagram feed. Only applies to reels.

`audioName`

`string`

No

Custom audio name for reels. You can only set this once per reel.

#### [hashtag](https://help.blotato.com/api/publish-post\#tiktok)    TikTok

Field

Type

Required

Description

`targetType`

`"tiktok"`

Yes

`privacyLevel`

`string`

Yes

`SELF_ONLY`, `PUBLIC_TO_EVERYONE`, `MUTUAL_FOLLOW_FRIENDS`, or `FOLLOWER_OF_CREATOR`

`disabledComments`

`boolean`

Yes

`disabledDuet`

`boolean`

Yes

`disabledStitch`

`boolean`

Yes

`isBrandedContent`

`boolean`

Yes

`isYourBrand`

`boolean`

Yes

`isAiGenerated`

`boolean`

Yes

`title`

`string`

No

Title for image posts. Max 90 characters. No effect on videos.

`autoAddMusic`

`boolean`

No

Add music to photo posts. No effect on videos. Default: `false`.

`isDraft`

`boolean`

No

Post as a draft. Drafts appear in TikTok mobile app notifications, not the Drafts folder.

`imageCoverIndex`

`number`

No

Index (starting from 0) of image to use as cover for carousels.

`videoCoverTimestamp`

`number`

No

Timestamp in milliseconds to use as video cover.

#### [hashtag](https://help.blotato.com/api/publish-post\#pinterest)    Pinterest

Field

Type

Required

Description

`targetType`

`"pinterest"`

Yes

`boardId`

`string`

Yes

Pinterest Board ID. [How to get it](https://help.blotato.com/api/accounts#pinterest).

`title`

`string`

No

Pin title.

`altText`

`string`

No

Pin alt text.

`link`

`string`

No

Pin URL link.

Pinterest "description" comes from the `content.text` field.

#### [hashtag](https://help.blotato.com/api/publish-post\#threads)    Threads

Field

Type

Required

Description

`targetType`

`"threads"`

Yes

`replyControl`

`string`

No

`everyone`, `accounts_you_follow`, or `mentioned_only`

#### [hashtag](https://help.blotato.com/api/publish-post\#bluesky)    Bluesky

Field

Type

Required

`targetType`

`"bluesky"`

Yes

#### [hashtag](https://help.blotato.com/api/publish-post\#youtube)    YouTube

Field

Type

Required

Description

`targetType`

`"youtube"`

Yes

`title`

`string`

Yes

Video title.

`privacyStatus`

`string`

Yes

`private`, `public`, or `unlisted`

`shouldNotifySubscribers`

`boolean`

Yes

`isMadeForKids`

`boolean`

No

Default: `false`

`containsSyntheticMedia`

`boolean`

No

Whether media contains AI-generated content.

#### [hashtag](https://help.blotato.com/api/publish-post\#webhook)    Webhook

Field

Type

Required

Description

`targetType`

`"webhook"`

Yes

`url`

`string`

Yes

The webhook URL to send the post data.

* * *

### [hashtag](https://help.blotato.com/api/publish-post\#response)    Response

**Status Code:**`201 Created`

Copy

```
{
  "postSubmissionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

Use `postSubmissionId` to poll [Get Post Status](https://help.blotato.com/api/publish-post/get-post) for publishing progress.

Failed posts are visible at [https://my.blotato.com/failedarrow-up-right](https://my.blotato.com/failed). The most common cause of failed posts is incorrect JSON structure.

* * *

### [hashtag](https://help.blotato.com/api/publish-post\#examples)    Examples

#### [hashtag](https://help.blotato.com/api/publish-post\#id-1.-simplest-post-twitter-text-only)    1\. Simplest Post (Twitter, text only)

Copy

```
POST https://backend.blotato.com/v2/posts HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "post": {
    "accountId": "98432",
    "content": {
      "text": "Hello, world!",
      "mediaUrls": [],
      "platform": "twitter"
    },
    "target": {
      "targetType": "twitter"
    }
  }
}
```

#### [hashtag](https://help.blotato.com/api/publish-post\#id-2.-instagram-post-with-images)    2\. Instagram Post with Images

Copy

```
POST https://backend.blotato.com/v2/posts HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "post": {
    "accountId": "98434",
    "content": {
      "text": "Check out these photos!",
      "mediaUrls": [\
        "https://example.com/image1.jpg",\
        "https://example.com/image2.jpg"\
      ],
      "platform": "instagram"
    },
    "target": {
      "targetType": "instagram"
    }
  }
}
```

Posting multiple images to Instagram creates a carousel.

#### [hashtag](https://help.blotato.com/api/publish-post\#id-3.-facebook-page-post)    3\. Facebook Page Post

Copy

```
POST https://backend.blotato.com/v2/posts HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "post": {
    "accountId": "98433",
    "content": {
      "text": "New product announcement!",
      "mediaUrls": ["https://example.com/product.jpg"],
      "platform": "facebook"
    },
    "target": {
      "targetType": "facebook",
      "pageId": "123456789"
    }
  }
}
```

Get `accountId` and `pageId` from the [Accounts endpoints](https://help.blotato.com/api/accounts#facebook).

#### [hashtag](https://help.blotato.com/api/publish-post\#id-4.-tiktok-post-all-required-fields)    4\. TikTok Post (all required fields)

Copy

```
POST https://backend.blotato.com/v2/posts HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "post": {
    "accountId": "98435",
    "content": {
      "text": "Tips for productivity",
      "mediaUrls": ["https://example.com/video.mp4"],
      "platform": "tiktok"
    },
    "target": {
      "targetType": "tiktok",
      "privacyLevel": "PUBLIC_TO_EVERYONE",
      "disabledComments": false,
      "disabledDuet": false,
      "disabledStitch": false,
      "isBrandedContent": false,
      "isYourBrand": false,
      "isAiGenerated": true
    }
  }
}
```

#### [hashtag](https://help.blotato.com/api/publish-post\#id-5.-scheduled-post)    5\. Scheduled Post

Copy

```
POST https://backend.blotato.com/v2/posts HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "post": {
    "accountId": "98432",
    "content": {
      "text": "This will go live later",
      "mediaUrls": [],
      "platform": "twitter"
    },
    "target": {
      "targetType": "twitter"
    }
  },
  "scheduledTime": "2025-12-25T15:00:00Z"
}
```

#### [hashtag](https://help.blotato.com/api/publish-post\#id-6.-twitter-thread)    6\. Twitter Thread

Copy

```
POST https://backend.blotato.com/v2/posts HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "post": {
    "accountId": "98432",
    "content": {
      "text": "Here is a thread about AI content creation (1/3)",
      "mediaUrls": [],
      "platform": "twitter",
      "additionalPosts": [\
        {\
          "text": "First, research your topic using reliable sources (2/3)",\
          "mediaUrls": []\
        },\
        {\
          "text": "Then, create visuals and publish across platforms (3/3)",\
          "mediaUrls": []\
        }\
      ]
    },
    "target": {
      "targetType": "twitter"
    }
  }
}
```

Threads work for Twitter, Bluesky, and Threads.

#### [hashtag](https://help.blotato.com/api/publish-post\#id-7.-schedule-at-next-free-slot)    7\. Schedule at Next Free Slot

Copy

```
POST https://backend.blotato.com/v2/posts HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "post": {
    "accountId": "98432",
    "content": {
      "text": "Scheduled to the next free slot",
      "mediaUrls": [],
      "platform": "twitter"
    },
    "target": {
      "targetType": "twitter"
    }
  },
  "useNextFreeSlot": true
}
```

`useNextFreeSlot` and `scheduledTime` are top-level fields, not inside `post`.

[PreviousVoice IDschevron-left](https://help.blotato.com/api/accounts/voice-ids) [NextGet Post Statuschevron-right](https://help.blotato.com/api/publish-post/get-post)

Last updated 17 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Workflows | Blotato Help
URL: https://help.blotato.com/api/workflows

Most Blotato API operations are asynchronous. You must follow the **Submit -> Poll -> Result** pattern.

## [hashtag](https://help.blotato.com/api/workflows\#system-prompt-for-agents)    System Prompt for Agents

You can use the following snippet to instruct your AI agent on how to interact with Blotato:

> **Blotato API Protocol**: All creation operations (posts, videos, sources) are **async**.
>
> 1. Call the `CREATE` endpoint. Record the ID from the 201 response (`id` for sources, `item.id` for videos, `postSubmissionId` for posts).
>
> 2. Loop every 2-5 seconds calling the `GET` endpoint with that ID.
>
> 3. Continue polling while status is processing (see status values below).
>
> 4. Succeed when status reaches a terminal state.
>
>
> **Terminal Status Values by Operation**:
>
> - **Sources**: `completed` (success) or `failed`
>
> - **Videos**: `done` (success) or `creation-from-template-failed`
>
> - **Posts**: `published` (success) or `failed`
>
>
> **All Video Status Values** (in order): `queueing` -\> `generating-script` -\> `script-ready` -\> `generating-media` -\> `media-ready` -\> `exporting` -\> `done`
>
> **Always fetch accounts first**: `GET /v2/users/me/accounts` to get `accountId` for publishing. For Facebook/LinkedIn, also fetch `GET /v2/users/me/accounts/{accountId}/subaccounts` to get `pageId`.
>
> **Set**`content.platform` **and**`target.targetType` **to the same value** (e.g., both `"twitter"`).
>
> Full reference: https://help.blotato.com/api/llm

* * *

## [hashtag](https://help.blotato.com/api/workflows\#id-1.-create-source-greater-than-get-source)    1\. Create Source -> Get Source

**Goal**: Research a topic or extract content from a URL so Blotato can generate related visuals.

**Endpoints**:

- Create: `POST /v2/source-resolutions-v3`

- Poll: `GET /v2/source-resolutions-v3/:id`


**Source Types**:

- `youtube`, `tiktok`, `article`, `pdf`, `audio`, `twitter` \- Extract content from a URL (each type requires a `url` field)

- `text` \- Transform raw text content with optional AI instructions

- `perplexity-query` \- AI-powered web research on any topic (requires a `text` field)


### [hashtag](https://help.blotato.com/api/workflows\#example-payloads)    Example Payloads

**From YouTube URL**:

Copy

```
{
  "source": {
    "sourceType": "youtube",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
}
```

**From AI Research Query** (use this for agents to research topics):

Copy

```
{
  "source": {
    "sourceType": "perplexity-query",
    "text": "latest trends in AI-generated content for social media"
  }
}
```

**From Text with Custom Instructions**:

Copy

```
{
  "source": {
    "sourceType": "text",
    "text": "Your raw content here..."
  },
  "customInstructions": "Summarize in 5 bullet points for Instagram carousel"
}
```

* * *

## [hashtag](https://help.blotato.com/api/workflows\#id-2.-create-visual-greater-than-get-visual)    2\. Create Visual -> Get Visual

**Goal**: Generate a video or image from a template.

**Endpoints**:

- Create: `POST /v2/videos/from-templates`

- Poll: `GET /v2/videos/creations/:id`

- Templates: `GET /v2/videos/templates?fields=id,name,description,inputs`


### [hashtag](https://help.blotato.com/api/workflows\#discovering-templates)    Discovering Templates

If you don't have a specific template ID, retrieve available templates:

Copy

```
GET https://backend.blotato.com/v2/videos/templates?fields=id,name,description,inputs&search=carousel
```

**Recommendation for Agents**: If freely deciding which template to use, carousel templates are versatile and work well for most content repurposing scenarios. See [all visual templates](https://help.blotato.com/api/visuals) for IDs and specs.

### [hashtag](https://help.blotato.com/api/workflows\#visual-generation-flow)    Visual Generation Flow

### [hashtag](https://help.blotato.com/api/workflows\#example-payload-with-ai-prompt)    Example Payload (with AI Prompt)

Copy

```
{
  "templateId": "5903b592-1255-43b4-b9ac-f8ed7cbf6a5f",
  "inputs": {},
  "prompt": "Create a 5-slide carousel about productivity tips",
  "render": true
}
```

### [hashtag](https://help.blotato.com/api/workflows\#example-payload-with-manual-inputs)    Example Payload (with Manual Inputs)

Copy

```
{
  "templateId": "5903b592-1255-43b4-b9ac-f8ed7cbf6a5f",
  "inputs": {
    "title": "My Viral Video",
    "images": ["https://..."]
  },
  "render": true
}
```

* * *

## [hashtag](https://help.blotato.com/api/workflows\#id-3.-create-post-greater-than-get-post)    3\. Create Post -> Get Post

**Goal**: Publish content to a social platform.

**Endpoints**:

- Create: `POST /v2/posts`

- Poll: `GET /v2/posts/:postSubmissionId`

- Account Lookup: `GET /v2/users/me/accounts` ( [docs](https://help.blotato.com/api/accounts))

- Subaccounts (for pageId): `GET /v2/users/me/accounts/:accountId/subaccounts` ( [docs](https://help.blotato.com/api/accounts#list-subaccounts-pages))


> **n8n / Make.com users**: Use the official Blotato **Get Post** node (select "Post" > "Get") instead of raw HTTP requests. It handles authentication and response parsing automatically. [Install guide](https://help.blotato.com/api/start#n8n)

> \[!IMPORTANT\] **Prerequisites**:
>
> 1. `accountId`: Get this from `GET /v2/users/me/accounts`. Always fetch the user's accounts before publishing. See [Accounts reference](https://help.blotato.com/api/accounts).
>
> 2. `pageId` (Facebook/LinkedIn): Get this from `GET /v2/users/me/accounts/{accountId}/subaccounts`. See [How to Get the Right IDs](https://help.blotato.com/api/accounts#how-to-get-the-right-ids-for-publishing).
>
> 3. `mediaUrls`: Pass URLs directly from the **Visual Workflow** (outputs `mediaUrl` and `imageUrls`). No upload step required.
>
> 4. `content.platform` **and**`target.targetType`: Set both to the same platform value (e.g., both `"twitter"`).

### [hashtag](https://help.blotato.com/api/workflows\#step-0-fetch-available-accounts-always-do-this-first)    Step 0: Fetch Available Accounts (Always Do This First)

Copy

```
GET https://backend.blotato.com/v2/users/me/accounts
```

Response:

Copy

```
{
  "items": [\
    { "id": "98432", "platform": "twitter", "fullname": "Jane Smith", "username": "janesmith" }\
  ]
}
```

For Facebook/LinkedIn, also fetch subaccounts to get the `pageId`:

Copy

```
GET https://backend.blotato.com/v2/users/me/accounts/98432/subaccounts
```

See [Accounts reference](https://help.blotato.com/api/accounts) for full details.

### [hashtag](https://help.blotato.com/api/workflows\#publish-flow)    Publish Flow

### [hashtag](https://help.blotato.com/api/workflows\#example-payload)    Example Payload

Copy

```
{
  "post": {
    "accountId": "98432",
    "content": {
      "text": "Hello world!",
      "mediaUrls": ["https://database.blotato.io/user_1/media/vid_456.mp4"],
      "platform": "twitter"
    },
    "target": {
      "targetType": "twitter"
    }
  }
}
```

Get `accountId` from `GET /v2/users/me/accounts`. Set `content.platform` and `target.targetType` to the same value.

To schedule instead of publishing immediately, add `useNextFreeSlot` or `scheduledTime` as a top-level field (sibling of `post`, not inside it). See [Publish Post](https://help.blotato.com/api/publish-post#request-body) for details.

* * *

## [hashtag](https://help.blotato.com/api/workflows\#complete-end-to-end-workflow-recommended-for-ai-agents)    Complete End-to-End Workflow (Recommended for AI Agents)

This is the standard content creation sequence: research topic → create visual → publish to social.

### [hashtag](https://help.blotato.com/api/workflows\#pseudocode-for-agents)    Pseudocode for Agents

Copy

```
1. accountsList = GET /v2/users/me/accounts
2. sourceId = POST /v2/source-resolutions-v3 (specify sourceType: youtube, article, text, etc.)
3. LOOP: source = GET /v2/source-resolutions-v3/:sourceId
   - IF status = "completed": BREAK
   - IF status = "failed": STOP, report error
   - ELSE: WAIT 2-5 seconds, retry
4. videoId = POST /v2/videos/from-templates (use source.content in prompt)
5. LOOP: video = GET /v2/videos/creations/:videoId
   - IF status = "done": BREAK
   - IF status = "creation-from-template-failed": STOP, report error
   - ELSE: WAIT 5 seconds, retry
6. postId = POST /v2/posts (accountId from step 1, mediaUrl/imageUrls from step 5)
   - Set content.platform and target.targetType to the same value
7. LOOP: post = GET /v2/posts/:postId
   - IF status = "published": BREAK
   - IF status = "failed": STOP, check errorMessage
   - ELSE: WAIT 2 seconds, retry
8. RETURN: post.publicUrl
```

* * *

## [hashtag](https://help.blotato.com/api/workflows\#error-handling)    Error Handling

All asynchronous operations can fail during processing. Handle failures gracefully:

### [hashtag](https://help.blotato.com/api/workflows\#status-failure)    Status Failure

When polling returns `status: "failed"`, check the error message:

**Source Failure** (Get Source endpoint):

Copy

```
{
  "status": "failed",
  "message": "Unable to extract content from URL"
}
```

**Video Failure** (Get Visual Status endpoint):

Copy

```
{
  "item": {
    "status": "creation-from-template-failed"
  }
}
```

**Post Failure** (Get Post Status endpoint):

Copy

```
{
  "postSubmissionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "failed",
  "errorMessage": "Invalid account credentials"
}
```

### [hashtag](https://help.blotato.com/api/workflows\#retry-strategy)    Retry Strategy

- **Don't retry automatically on failure** \- most failures are permanent

- **Log the error message** and report it to the user

- **Inform user** that the operation failed and provide next steps

- **Only retry on temporary network errors** (5xx status codes), not on 4xx errors


* * *

## [hashtag](https://help.blotato.com/api/workflows\#platform-specific-setup)    Platform-Specific Setup

Different platforms require different fields and have different requirements. See detailed guides:

- [**Instagram Setup**](https://help.blotato.com/settings/social-accounts/instagram) \- Reels, Stories, Collaborators, Alt Text

- [**LinkedIn Setup**](https://help.blotato.com/settings/social-accounts/linkedin) \- Company Pages, Professional Network

- [**Facebook Setup**](https://help.blotato.com/settings/social-accounts/facebook) \- Page ID, Media Types

- [**Platform Requirements**](https://help.blotato.com/tips-and-tricks/social-platform-requirements) \- All platforms at a glance


When publishing, always include the required fields for the target platform:

- **Facebook**: `target.pageId` (required)

- **LinkedIn**: `target.pageId` (optional)

- **Pinterest**: `target.boardId` (required)

- **TikTok**: `target.privacyLevel`, `target.disabledComments`, etc. (required)

- **Instagram**: `target.mediaType` (optional - default is "reel")

- **Twitter, Threads, Bluesky**: Minimal required fields


[PreviousAPI Reference for LLMschevron-left](https://help.blotato.com/api/llm) [NextAccountchevron-right](https://help.blotato.com/api/accounts)

Last updated 24 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Account | Blotato Help
URL: https://help.blotato.com/api/accounts

## [hashtag](https://help.blotato.com/api/accounts\#list-connected-accounts)    List Connected Accounts

### [hashtag](https://help.blotato.com/api/accounts\#endpoint)    Endpoint

**Base URL:**`https://backend.blotato.com/v2`

**URL:**`/users/me/accounts`

**Method:**`GET`

### [hashtag](https://help.blotato.com/api/accounts\#description)    Description

Returns all social media accounts connected to your Blotato account. Use this to get the `accountId` required for [publishing posts](https://help.blotato.com/api/publish-post).

### [hashtag](https://help.blotato.com/api/accounts\#query-parameters)    Query Parameters

Field

Type

Required

Description

`platform`

`string`

No

Filter by platform. Values: `twitter`, `instagram`, `linkedin`, `facebook`, `tiktok`, `pinterest`, `threads`, `bluesky`, `youtube`

The `platform` values here are the same values used in `content.platform` and `target.targetType` when publishing.

### [hashtag](https://help.blotato.com/api/accounts\#response)    Response

**Status Code:**`200 OK`

Copy

```
{
  "items": [\
    {\
      "id": "98432",\
      "platform": "twitter",\
      "fullname": "Jane Smith",\
      "username": "janesmith"\
    },\
    {\
      "id": "98433",\
      "platform": "facebook",\
      "fullname": "Jane Smith",\
      "username": "janesmith"\
    }\
  ]
}
```

Field

Type

Description

`items`

`array`

List of connected accounts

`items[].id`

`string`

Account ID. Use this as `accountId` when publishing.

`items[].platform`

`string`

Platform type (e.g., `twitter`, `facebook`, `instagram`)

`items[].fullname`

`string`

Display name of the account

`items[].username`

`string`

Username or handle

If no accounts are returned, the user needs to connect social accounts in [Blotato Settingsarrow-up-right](https://my.blotato.com/settings).

### [hashtag](https://help.blotato.com/api/accounts\#examples)    Examples

#### [hashtag](https://help.blotato.com/api/accounts\#list-all-accounts)    List all accounts

Copy

```
GET https://backend.blotato.com/v2/users/me/accounts HTTP/1.1
blotato-api-key: YOUR_API_KEY
```

#### [hashtag](https://help.blotato.com/api/accounts\#filter-by-platform)    Filter by platform

Copy

```
GET https://backend.blotato.com/v2/users/me/accounts?platform=instagram HTTP/1.1
blotato-api-key: YOUR_API_KEY
```

* * *

## [hashtag](https://help.blotato.com/api/accounts\#list-subaccounts-pages)    List Subaccounts (Pages)

### [hashtag](https://help.blotato.com/api/accounts\#endpoint-1)    Endpoint

**Base URL:**`https://backend.blotato.com/v2`

**URL:**`/users/me/accounts/:accountId/subaccounts`

**Method:**`GET`

### [hashtag](https://help.blotato.com/api/accounts\#description-1)    Description

Returns subaccounts for a connected account. Subaccounts include Facebook Pages and LinkedIn Company Pages. Use this to get the `pageId` required for publishing to these platforms.

### [hashtag](https://help.blotato.com/api/accounts\#path-parameters)    Path Parameters

Field

Type

Required

Description

`accountId`

`string`

Yes

The account ID from the List Accounts endpoint

### [hashtag](https://help.blotato.com/api/accounts\#response-1)    Response

**Status Code:**`200 OK`

Copy

```
{
  "items": [\
    {\
      "id": "123456789",\
      "accountId": "98433",\
      "name": "My Business Page"\
    }\
  ]
}
```

Field

Type

Description

`items`

`array`

List of subaccounts

`items[].id`

`string`

Subaccount ID. Use this as `target.pageId` when publishing to Facebook or LinkedIn.

`items[].accountId`

`string`

Parent account ID

`items[].name`

`string`

Name of the page

If subaccounts is empty, the user needs to connect a Facebook Page or LinkedIn Company Page in [Blotato Settingsarrow-up-right](https://my.blotato.com/settings).

### [hashtag](https://help.blotato.com/api/accounts\#example)    Example

Copy

```
GET https://backend.blotato.com/v2/users/me/accounts/98433/subaccounts HTTP/1.1
blotato-api-key: YOUR_API_KEY
```

* * *

## [hashtag](https://help.blotato.com/api/accounts\#how-to-get-the-right-ids-for-publishing)    How to Get the Right IDs for Publishing

Different platforms need different IDs. Here is how to get them for each platform.

### [hashtag](https://help.blotato.com/api/accounts\#twitter-instagram-tiktok-threads-bluesky-youtube)    Twitter, Instagram, TikTok, Threads, Bluesky, YouTube

These platforms need only an `accountId`:

1. Call `GET /v2/users/me/accounts?platform=twitter` (replace with your platform)

2. Use `items[].id` as `accountId` in your publish request

3. If multiple accounts are returned, use `fullname` or `username` to identify the correct one, or ask the user which account to use


### [hashtag](https://help.blotato.com/api/accounts\#facebook)    Facebook

Facebook requires both `accountId` and `pageId`:

1. Call `GET /v2/users/me/accounts?platform=facebook`

2. Use `items[].id` as `accountId`

3. Call `GET /v2/users/me/accounts/{accountId}/subaccounts`

4. Use `items[].id` as `target.pageId` in your publish request

5. If multiple pages are returned, use `name` to identify the correct one, or ask the user which page to use


**Full example:**

Copy

```
1. GET /v2/users/me/accounts?platform=facebook
   Response: { "items": [{ "id": "98433", "platform": "facebook", ... }] }

2. GET /v2/users/me/accounts/98433/subaccounts
   Response: { "items": [{ "id": "123456789", "name": "My Business Page" }] }

3. POST /v2/posts with:
   {
     "post": {
       "accountId": "98433",
       "content": { "text": "Hello!", "mediaUrls": [], "platform": "facebook" },
       "target": { "targetType": "facebook", "pageId": "123456789" }
     }
   }
```

### [hashtag](https://help.blotato.com/api/accounts\#linkedin-company-page)    LinkedIn Company Page

To post to a LinkedIn Company Page instead of your personal profile:

1. Call `GET /v2/users/me/accounts?platform=linkedin`

2. Use `items[].id` as `accountId`

3. Call `GET /v2/users/me/accounts/{accountId}/subaccounts`

4. Use `items[].id` as `target.pageId`

5. If you skip `pageId`, the post goes to your personal LinkedIn profile


### [hashtag](https://help.blotato.com/api/accounts\#pinterest)    Pinterest

Pinterest requires a `boardId`. Board IDs are not available via the API. Ask the user to provide their Pinterest Board ID.

The user finds their Board ID in Blotato:

1. Open [Blotatoarrow-up-right](https://my.blotato.com/remix)

2. Create a draft Pinterest post

3. Click "Publish" and choose a board

4. Copy the Board ID from the dropdown


Use the Board ID as `target.boardId` in your publish request.

[PreviousWorkflowschevron-left](https://help.blotato.com/api/workflows) [NextUser Infochevron-right](https://help.blotato.com/api/accounts/users)

Last updated 1 month ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# User Info | Blotato Help
URL: https://help.blotato.com/api/accounts/users

## [hashtag](https://help.blotato.com/api/accounts/users\#user-info-v2-users-me)    User Info /v2/users/me

### [hashtag](https://help.blotato.com/api/accounts/users\#general)    General

Fetches the current user's information, including subscription status. This endpoint is useful for verifying that your API key is valid and referencing your own `userId`.

### [hashtag](https://help.blotato.com/api/accounts/users\#endpoints)    Endpoints

**GET**`/v2/users/me`

#### [hashtag](https://help.blotato.com/api/accounts/users\#response-keys)    Response Keys

Name

Type

Description

`id`

`string`

The unique ID of the user.

`subscriptionStatus`

`string`

The user's subscription status (e.g., `active`, `generic_pro`).

`apiKey`

`string`

**\[Sensitive\]** The user's API key.

* * *

## [hashtag](https://help.blotato.com/api/accounts/users\#examples)    Examples

### [hashtag](https://help.blotato.com/api/accounts/users\#get-verification-info)    Get verification info

Copy

```
GET https://backend.blotato.com/v2/users/me HTTP/1.1
blotato-api-key: blt_...
```

**Response 200 OK**

Copy

```
{
  "id": "e931cdad-0c31-4191-8930-745a76c8e31a",
  "subscriptionStatus": "active_pro",
  "apiKey": "blt_..."
}
```

[PreviousAccountchevron-left](https://help.blotato.com/api/accounts) [NextVoice IDschevron-right](https://help.blotato.com/api/accounts/voice-ids)

Last updated 1 month ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Voice IDs | Blotato Help
URL: https://help.blotato.com/api/accounts/voice-ids

Custom ElevenLabs voices are not available as a native voiceId parameter in the Blotato API yet. Native API support is on the roadmap.

Workaround: Generate your ElevenLabs audio via the [ElevenLabs APIarrow-up-right](https://elevenlabs.io/docs/api-reference) separately, then pass the audio URL into the "Combine Existing Clips" template in the Create Visual node. This template accepts an optional audio/music URL, letting you combine any video with any custom voice.

To use custom voices in the web app, create your video at [Videos > Newarrow-up-right](https://my.blotato.com/videos/new) after adding your ElevenLabs API key in [Settingsarrow-up-right](https://my.blotato.com/settings).

The following ElevenLabs voices are available via the Blotato API:

ID

Name

Tags

elevenlabs/eleven\_multilingual\_v2/Xb7hH8MSUJpSbSDYk0k2

Alice

female, middle-aged, British, confident, news

elevenlabs/eleven\_multilingual\_v2/9BWtsMINqrJLrRacOk9x

Aria

female, middle-aged, American, expressive, social media

elevenlabs/eleven\_multilingual\_v2/pqHfZKP75CvOlQylNhV4

Bill

male, old, American, trustworthy, narration

elevenlabs/eleven\_multilingual\_v2/nPczCjzI2devNBz1zQrb

Brian

male, middle-aged, American, deep, narration

elevenlabs/eleven\_multilingual\_v2/N2lVS1w4EtoT3dr4eOWO

Callum

male, middle-aged, Transatlantic, intense, characters

elevenlabs/eleven\_multilingual\_v2/IKne3meq5aSn9XLyUdCD

Charlie

male, middle aged, Australian, natural, conversational

elevenlabs/eleven\_multilingual\_v2/XB0fDUnXU5powFXDhCwa

Charlotte

female, young, Swedish, seductive, characters

elevenlabs/eleven\_multilingual\_v2/iP95p4xoKVk53GoZ742B

Chris

male, middle-aged, American, casual, conversational

elevenlabs/eleven\_multilingual\_v2/onwK4e9ZLuTAKqWW03F9

Daniel

male, middle-aged, British, authoritative, news

elevenlabs/eleven\_multilingual\_v2/cjVigY5qzO86Huf0OWal

Eric

male, middle-aged, American, friendly, conversational

elevenlabs/eleven\_multilingual\_v2/JBFqnCBsd6RMkjVDRZzb

George

male, middle aged, British, warm, narration

elevenlabs/eleven\_multilingual\_v2/cgSgspJ2msm6clMCkdW9

Jessica

female, young, American, expressive, conversational

elevenlabs/eleven\_multilingual\_v2/FGY2WhTYpPnrIDTdsKH5

Laura

female, young, American, upbeat, social media

elevenlabs/eleven\_multilingual\_v2/TX3LPaxmHKxFdv7VOQHJ

Liam

male, young, American, articulate, narration

elevenlabs/eleven\_multilingual\_v2/pFZP5JQG7iQjIQuC4Bku

Lily

female, middle-aged, British, warm, narration

elevenlabs/eleven\_multilingual\_v2/XrExE9yKIg1WjnnlVkGX

Matilda

female, middle-aged, American, friendly, narration

elevenlabs/eleven\_multilingual\_v2/SAz9YHcvj6GT2YYXdXww

River

non-binary, middle-aged, American, confident, social media

elevenlabs/eleven\_multilingual\_v2/CwhRBWXzGAHq8TQ4Fs17

Roger

male, middle-aged, American, confident, social media

elevenlabs/eleven\_multilingual\_v2/EXAVITQu4vr4xnSDxMaL

Sarah

female, young, American, soft, news

elevenlabs/eleven\_multilingual\_v2/bIHbv24MWmeRgasZH58o

Will

male, young, American, friendly, social media

[PreviousUser Infochevron-left](https://help.blotato.com/api/accounts/users) [NextPostchevron-right](https://help.blotato.com/api/publish-post)

Last updated 25 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Get Post Status | Blotato Help
URL: https://help.blotato.com/api/publish-post/get-post

## [hashtag](https://help.blotato.com/api/publish-post/get-post\#check-post-status)    Check Post Status

### [hashtag](https://help.blotato.com/api/publish-post/get-post\#endpoint)    Endpoint

**Base URL:**`https://backend.blotato.com/v2`

**URL:**`/posts/:postSubmissionId`

**Method:**`GET`

**Rate Limit:** 60 requests / minute

### [hashtag](https://help.blotato.com/api/publish-post/get-post\#description)    Description

Poll this endpoint to check the publishing status of a post. After submitting a post with [Create Post](https://help.blotato.com/api/publish-post), use the returned `postSubmissionId` to track its progress.

### [hashtag](https://help.blotato.com/api/publish-post/get-post\#request)    Request

#### [hashtag](https://help.blotato.com/api/publish-post/get-post\#path-parameters)    Path Parameters

Field

Type

Required

Description

`postSubmissionId`

`string`

Yes

The post submission ID returned by the Create Post endpoint.

### [hashtag](https://help.blotato.com/api/publish-post/get-post\#responses)    Responses

#### [hashtag](https://help.blotato.com/api/publish-post/get-post\#success-response)    Success Response

**Status Code:**`200 OK`

The response shape depends on the current status:

**Published (terminal - success):**

Copy

```
{
  "postSubmissionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "published",
  "publicUrl": "https://x.com/user/status/123456"
}
```

**Failed (terminal - error):**

Copy

```
{
  "postSubmissionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "failed",
  "errorMessage": "Unsupported media type"
}
```

**In Progress (keep polling):**

Copy

```
{
  "postSubmissionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "in-progress"
}
```

#### [hashtag](https://help.blotato.com/api/publish-post/get-post\#response-keys)    Response Keys

Field

Type

Description

`postSubmissionId`

`string`

The post submission ID.

`status`

`string`

One of: `in-progress`, `published`, `failed`.

`publicUrl`

`string`

The live URL of the published post. Present when status is `published`.

`errorMessage`

`string`

Description of the failure. Present when status is `failed`.

### [hashtag](https://help.blotato.com/api/publish-post/get-post\#polling-strategy)    Polling Strategy

1. Poll every 2 seconds after submitting a post.

2. Continue while status is `in-progress`.

3. Stop when status is `published` (success) or `failed` (error).

4. Do not retry on `failed` \-\- most failures are permanent. Check `errorMessage` for details.


Failed posts are also visible at [https://my.blotato.com/failedarrow-up-right](https://my.blotato.com/failed).

### [hashtag](https://help.blotato.com/api/publish-post/get-post\#example)    Example

Copy

```
GET https://backend.blotato.com/v2/posts/a1b2c3d4-e5f6-7890-abcd-ef1234567890 HTTP/1.1
blotato-api-key: YOUR_API_KEY
```

[PreviousPostchevron-left](https://help.blotato.com/api/publish-post) [NextUpload Mediachevron-right](https://help.blotato.com/api/publish-post/upload-media-v2-media)

Last updated 1 month ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Upload Media | Blotato Help
URL: https://help.blotato.com/api/publish-post/upload-media-v2-media

## [hashtag](https://help.blotato.com/api/publish-post/upload-media-v2-media\#upload-is-now-optional)    Upload is Now Optional

You no longer need to upload media to Blotato before publishing. You can pass any publicly accessible image/video URL directly into the `mediaUrls` parameter in the Publish node. Blotato handles the media transfer automatically.

The Upload Media endpoint is still available if you prefer to use it, or if you need to host media on Blotato's servers.

* * *

## [hashtag](https://help.blotato.com/api/publish-post/upload-media-v2-media\#upload-media)    Upload Media

### [hashtag](https://help.blotato.com/api/publish-post/upload-media-v2-media\#endpoint)    Endpoint

**Base URL:**`https://backend.blotato.com/v2`

**URL:**`/media`

**Method:**`POST`

### [hashtag](https://help.blotato.com/api/publish-post/upload-media-v2-media\#description)    Description

This endpoint allows users to upload media by providing a URL. The uploaded media will be processed and stored, returning a new media URL that is used to publish a new post. Most of the platforms require validated URLs for posting images.

You can upload:

- publicly accessible URLs

- base64 encoded image data


Media uploads are limited to 200MB file size or smaller.

### [hashtag](https://help.blotato.com/api/publish-post/upload-media-v2-media\#request)    Request

#### [hashtag](https://help.blotato.com/api/publish-post/upload-media-v2-media\#request-body)    Request Body

Field

Type

Required

Description

`url`

`string`

✅

The URL of the media to upload.

### [hashtag](https://help.blotato.com/api/publish-post/upload-media-v2-media\#responses)    Responses

#### [hashtag](https://help.blotato.com/api/publish-post/upload-media-v2-media\#success-response)    Success Response

**Status Code:**`201 Created`

**Response Body:**

Copy

```
{
  "url": "https://database.blotato.com/path-to-uploaded-media.jpg"
}
```

#### [hashtag](https://help.blotato.com/api/publish-post/upload-media-v2-media\#error-responses)    Error Responses

**Internal Server Error**

**Status Code:**`500 Internal Server Error`

Copy

```
{
  "code": 9999,
  "message": "An unknown error occurred."
}
```

**Too Many Requests**

Media upload has a user-level rate limit of 30 requests / minute.

**Status Code:**`429 Too many requests`

Copy

```
{
  "statusCode": 429,
  "message": "Rate limit exceeded, retry in 49 seconds"
}
```

#### [hashtag](https://help.blotato.com/api/publish-post/upload-media-v2-media\#error-codes)    Error Codes

The following client error codes may be returned:

Code

Description

`9999`

Unknown error.

### [hashtag](https://help.blotato.com/api/publish-post/upload-media-v2-media\#examples)    Examples

#### [hashtag](https://help.blotato.com/api/publish-post/upload-media-v2-media\#id-1.-upload-media)    1\. Upload Media

Copy

```
POST https://backend.blotato.com/v2/media HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "url": "https://example.com/image.jpg"
}
```

**Response:**

Copy

```
{
  "url": "https://database.blotato.com/d1655c49-0bc4-4dd0-88b2-323ce0069fa4.jpg"
}
```

## [hashtag](https://help.blotato.com/api/publish-post/upload-media-v2-media\#using-google-drive-as-a-media-source)    Using Google Drive as a Media Source

Google Drive share links open a viewer page, not a direct file. Blotato needs a direct file URL to fetch and read media.

### [hashtag](https://help.blotato.com/api/publish-post/upload-media-v2-media\#set-sharing-permissions)    Set sharing permissions

For automation workflows (n8n, Make.com), set the entire Google Drive **folder** to "Anyone with the link" as Viewer. All files inside that folder inherit the same permission, so you do not need to set permissions on each file individually.

For one-off uploads, set the individual file to "Anyone with the link" as Viewer.

### [hashtag](https://help.blotato.com/api/publish-post/upload-media-v2-media\#common-google-drive-url-errors)    Common Google Drive URL Errors

**Folder URLs don't work**: If your link looks like `/drive/folders/...`, it's a folder link. Blotato needs a direct link to a specific file, not a folder.

**Preview URLs don't work reliably**: If your link ends with `/view?...`, it points to Google Drive's preview page, not the raw file.

### [hashtag](https://help.blotato.com/api/publish-post/upload-media-v2-media\#use-the-direct-download-url-format)    Use the direct download URL format

For files under 100MB, replace the standard share link with this format:

Copy

```
https://drive.usercontent.google.com/download?id={FILE_ID}&export=download&confirm=t
```

Replace `{FILE_ID}` with the ID from your share link. For example, if your share link is:

Copy

```
https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/view
```

The file ID is `1aBcDeFgHiJkLmNoPqRsTuVwXyZ`, so the direct URL is:

Copy

```
https://drive.usercontent.google.com/download?id=1aBcDeFgHiJkLmNoPqRsTuVwXyZ&export=download&confirm=t
```

Make sure the file is shared with "Anyone with the link" as Viewer.

### [hashtag](https://help.blotato.com/api/publish-post/upload-media-v2-media\#seeing-error-google-drive-cant-scan-this-file-for-viruses)    Seeing error "Google Drive can't scan this file for viruses"?

This is the most common issue when using Google Drive. For large videos (100MB+), Google Drive shows a virus-scan popup that blocks Blotato from accessing the file.

![](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252F1QSVfY0thWo74EFW1LLX%252Fimage.png%3Falt%3Dmedia%26token%3D0175e0b5-1bdd-43cc-8597-d5e48798929d&width=768&dpr=3&quality=100&sign=f029db7b&sv=2)

For large files, use Dropbox, AWS S3, or Google Cloud Storage instead. These services provide direct download URLs without the virus-scan popup.

[PreviousGet Post Statuschevron-left](https://help.blotato.com/api/publish-post/get-post) [NextScheduled Postschevron-right](https://help.blotato.com/api/schedules)

Last updated 17 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Scheduled Posts | Blotato Help
URL: https://help.blotato.com/api/schedules

## [hashtag](https://help.blotato.com/api/schedules\#managing-scheduled-posts)    Managing Scheduled Posts

Scheduled posts are created via [Publish Post](https://help.blotato.com/api/publish-post) using `scheduledTime` or `useNextFreeSlot`. These endpoints let you list, inspect, update, and delete scheduled posts before they publish.

* * *

## [hashtag](https://help.blotato.com/api/schedules\#list-scheduled-posts)    List Scheduled Posts

### [hashtag](https://help.blotato.com/api/schedules\#endpoint)    Endpoint

**Base URL:**`https://backend.blotato.com/v2`

**URL:**`/schedules`

**Method:**`GET`

### [hashtag](https://help.blotato.com/api/schedules\#description)    Description

Returns the current user's scheduled posts, ordered by scheduled time (ascending). Only returns posts scheduled in the future. Supports cursor-based pagination.

### [hashtag](https://help.blotato.com/api/schedules\#query-parameters)    Query Parameters

Field

Type

Required

Description

`limit`

`integer`

No

Number of scheduled posts to return per page. Max `100`. Defaults to `20`.

`cursor`

`string`

No

Pagination cursor from a previous response.

### [hashtag](https://help.blotato.com/api/schedules\#response)    Response

**Status Code:**`200 OK`

Copy

```
{
  "items": [\
    {\
      "id": "abc123",\
      "scheduledAt": "2026-04-01T12:00:00.000Z",\
      "draft": {\
        "accountId": "98432",\
        "content": {\
          "text": "Scheduled tweet",\
          "mediaUrls": [],\
          "platform": "twitter"\
        },\
        "target": {\
          "targetType": "twitter"\
        }\
      },\
      "account": {\
        "id": "98432",\
        "name": "John Doe",\
        "username": "johndoe",\
        "profileImageUrl": "https://example.com/avatar.jpg",\
        "subaccountId": null,\
        "subId": null,\
        "subaccountName": null\
      }\
    }\
  ],
  "count": "1",
  "cursor": "eyJzY2hlZHVsZWRBdCI6..."
}
```

#### [hashtag](https://help.blotato.com/api/schedules\#response-keys)    Response Keys

Field

Type

Description

`items`

`array`

Array of scheduled post objects.

`items[].id`

`string`

Scheduled post ID. Use this for get, update, and delete operations.

`items[].scheduledAt`

`string`

Scheduled time in ISO 8601 UTC.

`items[].draft`

`object`

The post content. Same structure as the `post` object in [Publish Post](https://help.blotato.com/api/publish-post).

`items[].account`

`object or null`

The target account info. `null` if the account has been disconnected.

`count`

`string`

Total number of future scheduled posts.

`cursor`

`string`

Pagination cursor. Present when there are more results. Pass as `cursor` query parameter to get the next page.

### [hashtag](https://help.blotato.com/api/schedules\#example)    Example

Copy

```
GET https://backend.blotato.com/v2/schedules?limit=10 HTTP/1.1
blotato-api-key: YOUR_API_KEY
```

* * *

## [hashtag](https://help.blotato.com/api/schedules\#get-scheduled-post)    Get Scheduled Post

### [hashtag](https://help.blotato.com/api/schedules\#endpoint-1)    Endpoint

**Base URL:**`https://backend.blotato.com/v2`

**URL:**`/schedules/:id`

**Method:**`GET`

### [hashtag](https://help.blotato.com/api/schedules\#description-1)    Description

Fetch a single scheduled post by its ID.

### [hashtag](https://help.blotato.com/api/schedules\#path-parameters)    Path Parameters

Field

Type

Required

Description

`id`

`string`

Yes

The scheduled post ID from List Scheduled Posts.

### [hashtag](https://help.blotato.com/api/schedules\#response-1)    Response

**Status Code:**`200 OK`

Copy

```
{
  "schedule": {
    "id": "abc123",
    "scheduledAt": "2026-04-01T12:00:00.000Z",
    "draft": {
      "accountId": "98432",
      "content": {
        "text": "Scheduled tweet",
        "mediaUrls": [],
        "platform": "twitter"
      },
      "target": {
        "targetType": "twitter"
      }
    },
    "account": {
      "id": "98432",
      "name": "John Doe",
      "username": "johndoe",
      "profileImageUrl": "https://example.com/avatar.jpg",
      "subaccountId": null,
      "subId": null,
      "subaccountName": null
    }
  }
}
```

**Status Code:**`404 Not Found`

Copy

```
{
  "message": "Schedule not found"
}
```

### [hashtag](https://help.blotato.com/api/schedules\#example-1)    Example

Copy

```
GET https://backend.blotato.com/v2/schedules/abc123 HTTP/1.1
blotato-api-key: YOUR_API_KEY
```

* * *

## [hashtag](https://help.blotato.com/api/schedules\#update-scheduled-post)    Update Scheduled Post

### [hashtag](https://help.blotato.com/api/schedules\#endpoint-2)    Endpoint

**Base URL:**`https://backend.blotato.com/v2`

**URL:**`/schedules/:id`

**Method:**`PATCH`

### [hashtag](https://help.blotato.com/api/schedules\#description-2)    Description

Update a scheduled post's content, scheduled time, or both. At least one field must be provided. The scheduled time must be in the future. When the scheduled time is changed, the post is re-queued for publishing at the new time.

### [hashtag](https://help.blotato.com/api/schedules\#path-parameters-1)    Path Parameters

Field

Type

Required

Description

`id`

`string`

Yes

The scheduled post ID from List Scheduled Posts.

### [hashtag](https://help.blotato.com/api/schedules\#request-body)    Request Body

Field

Type

Required

Description

`patch`

`object`

Yes

The fields to update.

`patch.draft`

`object`

No

Updated post content. Same structure as the `post` object in [Publish Post](https://help.blotato.com/api/publish-post).

`patch.scheduledTime`

`string`

No

New scheduled time in ISO 8601 format. Must be in the future.

### [hashtag](https://help.blotato.com/api/schedules\#response-2)    Response

**Status Code:**`204 No Content`

**Status Code:**`404 Not Found`

Copy

```
{
  "message": "Schedule not found"
}
```

**Status Code:**`422 Unprocessable Entity`

Copy

```
{
  "message": "scheduledTime must be in the future"
}
```

### [hashtag](https://help.blotato.com/api/schedules\#examples)    Examples

#### [hashtag](https://help.blotato.com/api/schedules\#update-scheduled-time)    Update Scheduled Time

Copy

```
PATCH https://backend.blotato.com/v2/schedules/abc123 HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "patch": {
    "scheduledTime": "2026-05-01T15:00:00Z"
  }
}
```

#### [hashtag](https://help.blotato.com/api/schedules\#update-post-content)    Update Post Content

Copy

```
PATCH https://backend.blotato.com/v2/schedules/abc123 HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "patch": {
    "draft": {
      "accountId": "98432",
      "content": {
        "text": "Updated text for this post",
        "mediaUrls": [],
        "platform": "twitter"
      },
      "target": {
        "targetType": "twitter"
      }
    }
  }
}
```

#### [hashtag](https://help.blotato.com/api/schedules\#update-both)    Update Both

Copy

```
PATCH https://backend.blotato.com/v2/schedules/abc123 HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "patch": {
    "draft": {
      "accountId": "98432",
      "content": {
        "text": "New text, new time",
        "mediaUrls": [],
        "platform": "twitter"
      },
      "target": {
        "targetType": "twitter"
      }
    },
    "scheduledTime": "2026-06-01T09:00:00Z"
  }
}
```

* * *

## [hashtag](https://help.blotato.com/api/schedules\#delete-scheduled-post)    Delete Scheduled Post

### [hashtag](https://help.blotato.com/api/schedules\#endpoint-3)    Endpoint

**Base URL:**`https://backend.blotato.com/v2`

**URL:**`/schedules/:id`

**Method:**`DELETE`

### [hashtag](https://help.blotato.com/api/schedules\#description-3)    Description

Delete a scheduled post. The associated publishing job is also cancelled. This action cannot be undone.

### [hashtag](https://help.blotato.com/api/schedules\#path-parameters-2)    Path Parameters

Field

Type

Required

Description

`id`

`string`

Yes

The scheduled post ID from List Scheduled Posts.

### [hashtag](https://help.blotato.com/api/schedules\#response-3)    Response

**Status Code:**`204 No Content`

### [hashtag](https://help.blotato.com/api/schedules\#example-2)    Example

Copy

```
DELETE https://backend.blotato.com/v2/schedules/abc123 HTTP/1.1
blotato-api-key: YOUR_API_KEY
```

[PreviousUpload Mediachevron-left](https://help.blotato.com/api/publish-post/upload-media-v2-media) [NextVisualchevron-right](https://help.blotato.com/api/create-video)

Last updated 8 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Visual | Blotato Help
URL: https://help.blotato.com/api/create-video

## [hashtag](https://help.blotato.com/api/create-video\#migrating-from-the-old-api-format)    Migrating from the Old API Format

If you are getting this error: `body.textToImageModel must be object, body.imageToVideoModel must NOT be valid`

Your workflow is using an outdated request format. The old `POST /v2/videos/creations` endpoint with `textToImageModel` and `imageToVideoModel` as string fields no longer works.

Switch to the template system using `POST /v2/videos/from-templates`:

1. Browse available templates at [my.blotato.com/videos/newarrow-up-right](https://my.blotato.com/videos/new)

2. In n8n or Make, replace the old node with the Blotato "Create Visual" node

3. Select your template from the dropdown (start with a carousel — it renders in seconds)

4. Open the [API Dashboardarrow-up-right](https://my.blotato.com/api-dashboard) to inspect the exact JSON payload each template expects

5. Override inputs one by one to customize


For AI story videos, choose the template named "AI Video with AI Voice."

See also: [n8n FAQ — textToImageModel and imageToVideoModelarrow-up-right](https://help.blotato.com/api/n8n/faqs#im-using-an-older-template-with-texttoimagemodel-and-imagetovidemodel-parameters-do-these-still-work)

* * *

## [hashtag](https://help.blotato.com/api/create-video\#creating-a-visual)    Creating a Visual

### [hashtag](https://help.blotato.com/api/create-video\#endpoint)    Endpoint

**Base URL:**`https://backend.blotato.com/v2`

**URL:**`/videos/from-templates`

**Method:**`POST`

### [hashtag](https://help.blotato.com/api/create-video\#description)    Description

This endpoint creates a new visual (image or video) from a template. Templates define the structure and input parameters for generating visuals like slideshows, quote cards, tweet cards, and more.

You can provide input parameters manually, or use the optional `prompt` parameter to have AI automatically fill in the template inputs based on your description.

### [hashtag](https://help.blotato.com/api/create-video\#request)    Request

#### [hashtag](https://help.blotato.com/api/create-video\#request-body)    Request Body

Field

Type

Required

Description

`templateId`

`string`

✅

The ID of the template to use. Get available templates from the `/v2/videos/templates` endpoint.

`inputs`

`object`

✅

Template-specific input parameters. Structure depends on the selected template. Can be an empty object `{}` if using the `prompt` parameter.

`prompt`

`string`

❌

Optional natural language prompt to auto-fill template inputs using AI. When provided, AI interprets your description and fills in the `inputs` automatically. Any manually provided `inputs` take precedence over AI-generated values.

`render`

`boolean`

❌

Whether to render the visual immediately. Default: `true`.

`isDraft`

`boolean`

❌

Save as draft without rendering. Default: `false`.

### [hashtag](https://help.blotato.com/api/create-video\#getting-available-templates)    Getting Available Templates

To list all available templates and their input specifications:

Copy

```
GET https://backend.blotato.com/v2/videos/templates?fields=id,name,description,inputs
```

**Query Parameters:**

Field

Type

Description

`fields`

`string`

Comma-separated list of fields to include. Use `id,name,description,inputs` to get full template details.

`search`

`string`

Optional regex term to filter templates by name or description.

`id`

`string`

Optional template ID to get a specific template.

### [hashtag](https://help.blotato.com/api/create-video\#responses)    Responses

#### [hashtag](https://help.blotato.com/api/create-video\#success-response)    Success Response

**Status Code:**`201 Created`

Visual creation is scheduled on the queue. To check status, poll the [Get Visual Status](https://help.blotato.com/api/create-video/find-video) endpoint.

**Response Body:**

Copy

```
{
  "item": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "queueing"
  }
}
```

#### [hashtag](https://help.blotato.com/api/create-video\#error-responses)    Error Responses

**Not Found**

**Status Code:**`404 Not Found`

Copy

```
{
  "message": "Unknown template ID"
}
```

**Too Many Requests**

Visual creation has a user-level rate limit of 30 requests / minute.

**Status Code:**`429 Too many requests`

Copy

```
{
  "statusCode": 429,
  "message": "Rate limit exceeded, retry in 49 seconds"
}
```

### [hashtag](https://help.blotato.com/api/create-video\#examples)    Examples

#### [hashtag](https://help.blotato.com/api/create-video\#id-1.-create-a-visual-using-ai-prompt-recommended)    1\. Create a Visual Using AI Prompt (Recommended)

The easiest way to create visuals is using the `prompt` parameter. AI will interpret your description and fill in the template inputs automatically.

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "5903b592-1255-43b4-b9ac-f8ed7cbf6a5f",
  "inputs": {},
  "prompt": "Create a 5-slide carousel about productivity tips for remote workers. Use a modern, professional style with blue tones.",
  "render": true
}
```

#### [hashtag](https://help.blotato.com/api/create-video\#id-2.-create-a-visual-with-manual-inputs)    2\. Create a Visual with Manual Inputs

You can also specify inputs manually for full control:

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "5903b592-1255-43b4-b9ac-f8ed7cbf6a5f",
  "inputs": {
    "slides": [\
      {\
        "imageSource": "https://example.com/image1.jpg",\
        "textOverlay": "Slide 1: Introduction"\
      },\
      {\
        "imageSource": "A serene mountain landscape at sunset",\
        "textOverlay": "Slide 2: AI-generated image"\
      }\
    ],
    "textPosition": "center",
    "aiImageModel": "replicate/recraft-ai/recraft-v3"
  },
  "render": true
}
```

#### [hashtag](https://help.blotato.com/api/create-video\#id-3.-combine-prompt-with-manual-overrides)    3\. Combine Prompt with Manual Overrides

You can use `prompt` for most inputs while manually specifying certain values:

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates HTTP/1.1
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "5903b592-1255-43b4-b9ac-f8ed7cbf6a5f",
  "inputs": {
    "textPosition": "bottom",
    "textColor": "#FFFFFF"
  },
  "prompt": "Create a 3-slide motivational carousel about morning routines",
  "render": true
}
```

In this example, AI fills in the slides content, but `textPosition` and `textColor` use your manual values.

### [hashtag](https://help.blotato.com/api/create-video\#available-templates)    Available Templates

Browse all templates with parameters and examples in the [Visual Templates](https://help.blotato.com/api/visuals) catalog. You can also use the `/v2/videos/templates` endpoint to get the current list programmatically. Common templates include:

Template Type

Description

Image Slideshow

Create slideshows from images with text overlays

Quote Card

Generate quote cards with stylized backgrounds

Tweet Card

Create visual cards from tweet-style content

Tutorial Carousel

Step-by-step tutorial visuals

AI Story Video

AI-generated story videos with narration

Combine Clips

Merge multiple video clips

### [hashtag](https://help.blotato.com/api/create-video\#template-input-types)    Template Input Types

Templates use various input types:

Type

Description

Example

`text`

Plain text string

`"Hello world"`

`number`

Numeric value

`42`

`boolean`

True/false

`true`

`enum`

Choice from predefined values

`"top"` \| `"center"` \| `"bottom"`

`image`

Image URL

`"https://example.com/image.jpg"`

`video`

Video URL

`"https://example.com/video.mp4"`

`color`

Hex color code

`"#FF5733"`

`array`

List of items

`[{...}, {...}]`

`object`

Nested object

`{ "key": "value" }`

### [hashtag](https://help.blotato.com/api/create-video\#troubleshooting)    Troubleshooting

If you're having trouble generating a visual or it's taking too long, navigate to `https://my.blotato.com/videos/<YOUR_VIDEO_ID>` to view and manually edit it.

### [hashtag](https://help.blotato.com/api/create-video\#polling-for-status)    Polling for Status

After creating a visual, poll the [Get Visual Status](https://help.blotato.com/api/create-video/find-video) endpoint to check its status:

Copy

```
GET https://backend.blotato.com/v2/videos/creations/<VIDEO_ID>
```

Status values (in order):

- `queueing` \- Waiting to be processed

- `generating-script` \- AI is generating the script

- `script-ready` \- Script is ready, generating media

- `generating-media` \- Media is being generated

- `media-ready` \- Media is ready, exporting

- `exporting` \- Final export in progress

- `done` \- Complete. Use `mediaUrl` or `imageUrls` from the response.

- `creation-from-template-failed` \- Generation failed


See [Get Visual Status](https://help.blotato.com/api/create-video/find-video) for full response details.

[PreviousScheduled Postschevron-left](https://help.blotato.com/api/schedules) [NextGet Visual Statuschevron-right](https://help.blotato.com/api/create-video/find-video)

Last updated 4 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Get Visual Status | Blotato Help
URL: https://help.blotato.com/api/create-video/find-video

## [hashtag](https://help.blotato.com/api/create-video/find-video\#check-visual-creation-status)    Check Visual Creation Status

### [hashtag](https://help.blotato.com/api/create-video/find-video\#endpoint)    Endpoint

**Base URL:**`https://backend.blotato.com/v2`

**URL:**`/videos/creations/:id`

**Method:**`GET`

### [hashtag](https://help.blotato.com/api/create-video/find-video\#description)    Description

Poll this endpoint to check the status of a visual creation. After submitting a request with [Create Visual](https://help.blotato.com/api/create-video), use the returned `id` to track its progress.

### [hashtag](https://help.blotato.com/api/create-video/find-video\#request)    Request

#### [hashtag](https://help.blotato.com/api/create-video/find-video\#path-parameters)    Path Parameters

Field

Type

Required

Description

`id`

`string`

Yes

The video/visual ID returned by Create Visual

### [hashtag](https://help.blotato.com/api/create-video/find-video\#response)    Response

**Status Code:**`200 OK`

#### [hashtag](https://help.blotato.com/api/create-video/find-video\#status-values)    Status Values

Status

Description

`queueing`

Request is queued. Keep polling.

`generating-script`

AI is generating the script. Keep polling.

`script-ready`

Script is ready, generating media. Keep polling.

`generating-media`

Media is being generated. Keep polling.

`media-ready`

Media is ready, exporting. Keep polling.

`exporting`

Final export in progress. Keep polling.

`done`

Complete. `mediaUrl` and/or `imageUrls` are available.

`creation-from-template-failed`

Creation failed.

#### [hashtag](https://help.blotato.com/api/create-video/find-video\#response-done-success)    Response: Done (success)

Copy

```
{
  "item": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "done",
    "createdAt": "2025-03-10T15:30:00Z",
    "mediaUrl": "https://database.blotato.io/user_1/media/video.mp4",
    "imageUrls": ["https://database.blotato.io/user_1/media/slide1.jpg", "https://database.blotato.io/user_1/media/slide2.jpg"]
  }
}
```

- `mediaUrl`: URL of the rendered video. Use this in `mediaUrls` when publishing.

- `imageUrls`: Array of image URLs (for slideshows/carousels). Use these in `mediaUrls` when publishing.


#### [hashtag](https://help.blotato.com/api/create-video/find-video\#response-in-progress)    Response: In Progress

Copy

```
{
  "item": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "generating-media",
    "createdAt": "2025-03-10T15:30:00Z",
    "mediaUrl": null,
    "imageUrls": null
  }
}
```

#### [hashtag](https://help.blotato.com/api/create-video/find-video\#response-failed)    Response: Failed

Copy

```
{
  "item": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "creation-from-template-failed",
    "createdAt": "2025-03-10T15:30:00Z",
    "mediaUrl": null,
    "imageUrls": null
  }
}
```

### [hashtag](https://help.blotato.com/api/create-video/find-video\#polling-pattern)    Polling Pattern

Copy

```
1. Create visual: POST /videos/from-templates -> get item.id
2. Poll: GET /videos/creations/{id}
3. If status is NOT "done" and NOT "creation-from-template-failed": wait 5 seconds, go to step 2
4. If status = "done": use mediaUrl or imageUrls
5. If status = "creation-from-template-failed": stop, creation failed
```

### [hashtag](https://help.blotato.com/api/create-video/find-video\#example)    Example

Copy

```
GET https://backend.blotato.com/v2/videos/creations/a1b2c3d4-e5f6-7890-abcd-ef1234567890 HTTP/1.1
blotato-api-key: YOUR_API_KEY
```

### [hashtag](https://help.blotato.com/api/create-video/find-video\#error-response)    Error Response

**Status Code:**`404 Not Found`

Copy

```
{
  "statusCode": 404,
  "message": "Not found"
}
```

[PreviousVisualchevron-left](https://help.blotato.com/api/create-video) [NextDelete Videochevron-right](https://help.blotato.com/api/create-video/delete-video)

Last updated 1 month ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Delete Video | Blotato Help
URL: https://help.blotato.com/api/create-video/delete-video

## [hashtag](https://help.blotato.com/api/create-video/delete-video\#deleting-a-single-video)    Deleting a single video

### [hashtag](https://help.blotato.com/api/create-video/delete-video\#endpoint)    Endpoint

**Base URL:**`https://backend.blotato.com/v2`

**URL:**`/videos/:id`

**Method:**`DELETE`

### [hashtag](https://help.blotato.com/api/create-video/delete-video\#description)    Description

Delete the video. Useful for cleaning up old, unused videos.

### [hashtag](https://help.blotato.com/api/create-video/delete-video\#request)    Request

#### [hashtag](https://help.blotato.com/api/create-video/delete-video\#request-params)    Request Params

The request path parameters must contain the following fields:

Field

Type

Required

Description

`id`

`string`

✅

Video ID

### [hashtag](https://help.blotato.com/api/create-video/delete-video\#responses)    Responses

#### [hashtag](https://help.blotato.com/api/create-video/delete-video\#success-response)    Success Response

**Status Code:**`204 No Content`

The video has been deleted successfully.

**Response Body:**

Copy

```
{
  "id": "VIDEO ID",
}
```

#### [hashtag](https://help.blotato.com/api/create-video/delete-video\#error-responses)    Error Responses

**Status Code:**`500 Internal server error`

Copy

```
{
  "statusCode": 500,
  "message": "Something went wrong"
}
```

[PreviousGet Visual Statuschevron-left](https://help.blotato.com/api/create-video/find-video) [NextVisual Templateschevron-right](https://help.blotato.com/api/visuals)

Last updated 8 months ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Image Slideshow with Text Overlays | Blotato Help
URL: https://help.blotato.com/api/visuals/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f

Create image slideshows with customizable text overlays. Images uploaded or AI-generated.

## [hashtag](https://help.blotato.com/api/visuals/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f\#when-to-use-this-template)    When to Use This Template

- You want to create a carousel or slideshow with images (your own uploads or AI-generated) and text on each slide

- You are a brand, marketer, or creator making Instagram carousels, TikTok slideshows, or LinkedIn carousels with visual + text content

- You have product photos, portfolio images, or event photos and want to add captions or descriptions to each

- You want AI to generate themed images with text for a quick carousel on any topic


## [hashtag](https://help.blotato.com/api/visuals/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f\#template-information)    Template Information

Property

Value

Template ID

`/base/v2/image-slideshow/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f/v1`

Output Type

Slideshow

Category

Image Slideshows

## [hashtag](https://help.blotato.com/api/visuals/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f\#parameters)    Parameters

Parameter

Type

Required

Default

Description

slides

array

Yes

-

Array of slide objects. Min: 1, Max: 50

slides\[\].imageSource

union

Yes

-

Upload image URL or AI prompt text to generate image

slides\[\].textOverlay

string

No

""

Text to display on slide. Max: 300 chars

aiImageModel

enum

No

fal-ai/imagen4/preview/fast

AI model for generating images. See values below

textPosition

enum

No

top

Values: top, center, bottom

customTextPositionPercent

number

No

-

Override preset position with custom % (0-100)

textStyle

enum

No

modern

Values: minimal, elegant, modern

textColor

color

No

#000000

Hex color for text

aspectRatio

enum

No

9:16

Values: 16:9, 1:1, 4:5, 9:16

slideDuration

number

No

5

Seconds per slide. Range: 1-10

transition

enum

No

none

Values: none, fade, slide, zoom

### [hashtag](https://help.blotato.com/api/visuals/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f\#available-ai-image-models)    Available AI Image Models

Pass one of these values as `aiImageModel` to control which AI model generates your images. Each model has a different credit cost. See [AI Video Credits](https://help.blotato.com/features/videos/ai-video-credits) for pricing.

Value

Label

Credits/Image

`replicate/black-forest-labs/flux-schnell`

Cheapest

1

`replicate/black-forest-labs/flux-dev`

Good

10

`replicate/black-forest-labs/flux-1.1-pro`

Great

15

`replicate/black-forest-labs/flux-1.1-pro-ultra`

Best for Images

20

`replicate/recraft-ai/recraft-v3`

Best for Realistic Image

15

`replicate/ideogram-ai/ideogram-v2`

Best for Text

30

`replicate/luma/photon`

Good

10

`openai/gpt-image-1`

OpenAI GPT Image

25

`fal-ai/nano-banana`

Nano Banana

15

`fal-ai/nano-banana/edit`

Nano Banana Edit

15

`fal-ai/nano-banana-pro`

Nano Banana Pro

50

`fal-ai/nano-banana-pro/edit`

Nano Banana Pro Edit

50

`fal-ai/imagen4/preview/fast`

Imagen 4 Fast (default)

7

`fal-ai/bytedance/seedream/v4.5/text-to-image`

Seedream v4.5

15

`fal-ai/bytedance/seedream/v4.5/edit`

Seedream v4.5 Edit

15

## [hashtag](https://help.blotato.com/api/visuals/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Use the `prompt` parameter to let AI fill in all inputs automatically.

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/image-slideshow/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f/v1",
  "inputs": {},
  "prompt": "Create a 5-slide carousel about productivity tips for remote workers. Use a modern professional style with blue tones.",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f\#example-2-manual-inputs)    Example 2: Manual Inputs

Specify all inputs manually for full control.

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/image-slideshow/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f/v1",
  "inputs": {
    "slides": [\
      {\
        "imageSource": "https://example.com/image1.jpg",\
        "textOverlay": "Step 1: Plan Your Day"\
      },\
      {\
        "imageSource": "A minimalist desk setup with laptop and coffee",\
        "textOverlay": "Step 2: Create Your Workspace"\
      },\
      {\
        "imageSource": "https://example.com/image3.jpg",\
        "textOverlay": "Step 3: Take Regular Breaks"\
      }\
    ],
    "textPosition": "bottom",
    "textStyle": "elegant",
    "aspectRatio": "4:5",
    "transition": "fade"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f\#example-3-hybrid-approach)    Example 3: Hybrid Approach

Use prompt for content with manual style overrides.

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/image-slideshow/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f/v1",
  "inputs": {
    "textPosition": "center",
    "textColor": "#FFFFFF",
    "aspectRatio": "1:1"
  },
  "prompt": "Create a 4-slide motivational carousel about morning routines with energetic imagery",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f\#related-templates)    Related Templates

- [Image Slideshow with Prominent Text](https://help.blotato.com/api/visuals/0ddb8655-c3da-43da-9f7d-be1915ca7818)

- [When X then Y Text Slideshow](https://help.blotato.com/api/visuals/c9892c3b-fa75-4ade-821a-a50ff8456230)


## [hashtag](https://help.blotato.com/api/visuals/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousVisual Templateschevron-left](https://help.blotato.com/api/visuals) [NextQuote Card with Monocolor Backgroundchevron-right](https://help.blotato.com/api/visuals/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd)

Last updated 4 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Quote Card with Monocolor Background | Blotato Help
URL: https://help.blotato.com/api/visuals/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd

Create quote card carousels with a clean monocolor paper background.

## [hashtag](https://help.blotato.com/api/visuals/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd\#when-to-use-this-template)    When to Use This Template

- You want a clean, text-only carousel of quotes with a solid color background

- You are a coach, motivational creator, or thought leader sharing quotes on Instagram, LinkedIn, or Twitter/X

- You do not need images -- text-only quote cards with a simple design

- You want to batch-produce quote carousels from a list of quotes or let AI generate them


## [hashtag](https://help.blotato.com/api/visuals/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd\#template-information)    Template Information

Property

Value

Template ID

`/base/v2/quote-card/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd/v1`

Output Type

Slideshow

Category

Quote Cards

## [hashtag](https://help.blotato.com/api/visuals/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd\#parameters)    Parameters

Parameter

Type

Required

Default

Description

font

enum

No

font-sans

Font family. Values: font-sans, font-serif, font-mono, font-retro, font-montserrat, font-quicksand, font-philosopher, font-poppins, font-raleway, font-opensans, font-lato, font-oswald, font-playfair, font-roboto, font-ptsans, font-dmsans, font-nunito, font-comfortaa, font-worksans, font-fjallaone, font-rubik, font-barlow, font-bebasnue, font-caveat, font-pacifico

title

string

Yes

Inspirational Quotes

Title for the carousel. Max: 50 chars

quotes

array

Yes

-

List of quote strings. Each quote becomes a card. Min: 1, Max: 100. Each quote: 10-500 chars

aspectRatio

enum

No

4:5

Values: 4:5, 1:1, 9:16

## [hashtag](https://help.blotato.com/api/visuals/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/quote-card/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd/v1",
  "inputs": {},
  "prompt": "Create 5 motivational quotes about entrepreneurship and building businesses",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/quote-card/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd/v1",
  "inputs": {
    "title": "Daily Wisdom",
    "quotes": [\
      "Be careful who you let speak into your life. Not all opinions are qualified.",\
      "People will question your choices...especially the ones too scared to make their own.",\
      "Take advice from people who have receipts, not opinions."\
    ],
    "font": "font-playfair",
    "aspectRatio": "1:1"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd\#example-3-hybrid-approach)    Example 3: Hybrid Approach

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/quote-card/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd/v1",
  "inputs": {
    "title": "Leadership Lessons",
    "font": "font-montserrat"
  },
  "prompt": "Generate 4 powerful quotes about leadership and team management",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd\#related-templates)    Related Templates

- [Quote Card with Paper Background and Highlight](https://help.blotato.com/api/visuals/f941e306-76f7-45da-b3d9-7463af630e91)

- [Tweet Card with Minimal Style](https://help.blotato.com/api/visuals/ba413be6-a840-4e60-8fd6-0066d3b427df)


## [hashtag](https://help.blotato.com/api/visuals/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousImage Slideshow with Text Overlayschevron-left](https://help.blotato.com/api/visuals/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f) [NextQuote Card with Paper Background and Highlightchevron-right](https://help.blotato.com/api/visuals/f941e306-76f7-45da-b3d9-7463af630e91)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Quote Card with Paper Background and Highlight | Blotato Help
URL: https://help.blotato.com/api/visuals/f941e306-76f7-45da-b3d9-7463af630e91

Create quote card carousels with paper background and highlighter effect on text.

## [hashtag](https://help.blotato.com/api/visuals/f941e306-76f7-45da-b3d9-7463af630e91\#when-to-use-this-template)    When to Use This Template

- You want quote cards with a paper texture background and colored highlighter effect on text

- You are creating "listicle" or "advice" style carousels that mimic a handwritten or notebook feel

- Popular format for Instagram carousels in the coaching, self-improvement, and personal development space


## [hashtag](https://help.blotato.com/api/visuals/f941e306-76f7-45da-b3d9-7463af630e91\#template-information)    Template Information

Property

Value

Template ID

`/base/v2/quote-card/f941e306-76f7-45da-b3d9-7463af630e91/v1`

Output Type

Slideshow

Category

Quote Cards

## [hashtag](https://help.blotato.com/api/visuals/f941e306-76f7-45da-b3d9-7463af630e91\#parameters)    Parameters

Parameter

Type

Required

Default

Description

font

enum

No

font-sans

Font family. 24 options available

title

string

Yes

I'm 35.\\nIf You're in Your\\n30s or 40s,\\nRead This:

Title text. Max: 50 chars

quotes

array

Yes

-

List of quote strings. Min: 1, Max: 100. Each: 10-500 chars

highlighterColor

color

No

#008000

Highlighter color behind text

paperBackground

enum

No

White paper

Values: White paper, Yellow paper, Light paper

aspectRatio

enum

No

4:5

Values: 4:5, 1:1, 9:16

## [hashtag](https://help.blotato.com/api/visuals/f941e306-76f7-45da-b3d9-7463af630e91\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/quote-card/f941e306-76f7-45da-b3d9-7463af630e91/v1",
  "inputs": {},
  "prompt": "Create a viral quote carousel about life lessons for people in their 30s",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/f941e306-76f7-45da-b3d9-7463af630e91\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/quote-card/f941e306-76f7-45da-b3d9-7463af630e91/v1",
  "inputs": {
    "title": "Hard Truths About Success",
    "quotes": [\
      "I wasted my 20s building other people's dreams. At 35, I started building my own.",\
      "People will question your choices...especially the ones too scared to make their own.",\
      "Take advice from people who have receipts, not opinions."\
    ],
    "highlighterColor": "#FFD700",
    "paperBackground": "Yellow paper",
    "aspectRatio": "4:5"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/f941e306-76f7-45da-b3d9-7463af630e91\#example-3-hybrid-approach)    Example 3: Hybrid Approach

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/quote-card/f941e306-76f7-45da-b3d9-7463af630e91/v1",
  "inputs": {
    "highlighterColor": "#FF6B6B",
    "paperBackground": "Light paper"
  },
  "prompt": "Generate 5 quotes about overcoming self-doubt and building confidence",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/f941e306-76f7-45da-b3d9-7463af630e91\#related-templates)    Related Templates

- [Quote Card with Monocolor Background](https://help.blotato.com/api/visuals/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd)

- [Tweet Card with Minimal Style](https://help.blotato.com/api/visuals/ba413be6-a840-4e60-8fd6-0066d3b427df)


## [hashtag](https://help.blotato.com/api/visuals/f941e306-76f7-45da-b3d9-7463af630e91\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousQuote Card with Monocolor Backgroundchevron-left](https://help.blotato.com/api/visuals/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd) [NextTweet Card with Minimal Stylechevron-right](https://help.blotato.com/api/visuals/ba413be6-a840-4e60-8fd6-0066d3b427df)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Tweet Card with Minimal Style | Blotato Help
URL: https://help.blotato.com/api/visuals/ba413be6-a840-4e60-8fd6-0066d3b427df

Create Twitter/X-style quote cards with a minimal design.

## [hashtag](https://help.blotato.com/api/visuals/ba413be6-a840-4e60-8fd6-0066d3b427df\#when-to-use-this-template)    When to Use This Template

- You want to repurpose tweets or X posts as carousel slides styled to look like actual tweets

- You are cross-posting Twitter/X content to Instagram, LinkedIn, or TikTok as a slideshow

- You want to quote an influencer or public figure in the familiar tweet card format

- Supports dark and light themes to match your brand


## [hashtag](https://help.blotato.com/api/visuals/ba413be6-a840-4e60-8fd6-0066d3b427df\#template-information)    Template Information

Property

Value

Template ID

`/base/v2/tweet-card/ba413be6-a840-4e60-8fd6-0066d3b427df/v1`

Output Type

Slideshow

Category

Tweet Cards

## [hashtag](https://help.blotato.com/api/visuals/ba413be6-a840-4e60-8fd6-0066d3b427df\#parameters)    Parameters

Parameter

Type

Required

Default

Description

quotes

array

Yes

-

List of quotes. Min: 1, Max: 100. Each: 10-280 chars (Twitter limit)

authorName

string

Yes

Dean Graziosi

Name of person quoted. Max: 60 chars

handle

string

Yes

deangraziosi

Social handle without @. Max: 50 chars

profileImage

image

No

-

Profile photo URL

verified

boolean

No

true

Show verified badge

theme

enum

No

dark

Values: dark, light

aspectRatio

enum

No

4:5

Values: 4:5, 1:1, 9:16

## [hashtag](https://help.blotato.com/api/visuals/ba413be6-a840-4e60-8fd6-0066d3b427df\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/tweet-card/ba413be6-a840-4e60-8fd6-0066d3b427df/v1",
  "inputs": {},
  "prompt": "Create 5 tweet-style quotes about building a personal brand on social media",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/ba413be6-a840-4e60-8fd6-0066d3b427df\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/tweet-card/ba413be6-a840-4e60-8fd6-0066d3b427df/v1",
  "inputs": {
    "quotes": [\
      "Be careful who you let speak into your life. Not all opinions are qualified.",\
      "People will question your choices...especially the ones too scared to make their own.",\
      "Take advice from people who have receipts, not opinions."\
    ],
    "authorName": "Alex Hormozi",
    "handle": "AlexHormozi",
    "profileImage": "https://example.com/alex-profile.jpg",
    "verified": true,
    "theme": "dark",
    "aspectRatio": "4:5"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/ba413be6-a840-4e60-8fd6-0066d3b427df\#example-3-hybrid-approach)    Example 3: Hybrid Approach

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/tweet-card/ba413be6-a840-4e60-8fd6-0066d3b427df/v1",
  "inputs": {
    "authorName": "Your Name",
    "handle": "yourhandle",
    "theme": "light"
  },
  "prompt": "Generate 4 motivational tweets about starting a business",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/ba413be6-a840-4e60-8fd6-0066d3b427df\#related-templates)    Related Templates

- [Tweet Card with Photo/Video Background](https://help.blotato.com/api/visuals/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66)

- [Quote Card with Monocolor Background](https://help.blotato.com/api/visuals/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd)


## [hashtag](https://help.blotato.com/api/visuals/ba413be6-a840-4e60-8fd6-0066d3b427df\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousQuote Card with Paper Background and Highlightchevron-left](https://help.blotato.com/api/visuals/f941e306-76f7-45da-b3d9-7463af630e91) [NextTweet Card with Photo/Video Backgroundchevron-right](https://help.blotato.com/api/visuals/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Tweet Card with Photo/Video Background | Blotato Help
URL: https://help.blotato.com/api/visuals/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66

Create Twitter/X-style quote cards with a photo or video background.

## [hashtag](https://help.blotato.com/api/visuals/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66\#when-to-use-this-template)    When to Use This Template

- Same as the minimal tweet card, but with your own photo or video as the background behind each tweet card

- You want a more visual, branded look for tweet-style quote carousels

- Useful for lifestyle, travel, or fitness creators who want tweet quotes overlaid on their own imagery


## [hashtag](https://help.blotato.com/api/visuals/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66\#template-information)    Template Information

Property

Value

Template ID

`/base/v2/tweet-card/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66/v1`

Output Type

Slideshow

Category

Tweet Cards

## [hashtag](https://help.blotato.com/api/visuals/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66\#parameters)    Parameters

Parameter

Type

Required

Default

Description

backgroundMedia

image

No

-

Background image or video URL

quotes

array

Yes

-

List of quotes. Min: 1, Max: 100. Each: 10-280 chars

authorName

string

Yes

Dean Graziosi

Name of person quoted. Max: 60 chars

handle

string

Yes

deangraziosi

Social handle without @. Max: 50 chars

profileImage

image

No

-

Profile photo URL

theme

enum

No

light

Values: light, dark

cardPosition

enum

No

bottom

Values: top, middle, bottom

verified

boolean

No

true

Show verified badge

enableBackdropBlur

boolean

No

false

Add blur effect behind card

accentColor

color

No

#C4A484

Background shape color

cardBackgroundColor

color

No

#FFFFFF

Card background color

textColor

color

No

#0F1419

Quote text color

aspectRatio

enum

No

4:5

Values: 4:5, 1:1, 9:16

## [hashtag](https://help.blotato.com/api/visuals/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/tweet-card/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66/v1",
  "inputs": {},
  "prompt": "Create 4 inspirational tweet cards about perseverance with mountain scenery backgrounds",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/tweet-card/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66/v1",
  "inputs": {
    "backgroundMedia": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    "quotes": [\
      "Be careful who you let speak into your life.",\
      "People will question your choices.",\
      "Take advice from people who have receipts."\
    ],
    "authorName": "Dean Graziosi",
    "handle": "deangraziosi",
    "theme": "light",
    "cardPosition": "bottom",
    "enableBackdropBlur": true,
    "accentColor": "#C4A484",
    "aspectRatio": "4:5"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66\#example-3-hybrid-approach)    Example 3: Hybrid Approach

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/tweet-card/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66/v1",
  "inputs": {
    "backgroundMedia": "https://example.com/nature-background.jpg",
    "authorName": "Your Brand",
    "handle": "yourbrand",
    "cardPosition": "middle",
    "enableBackdropBlur": true
  },
  "prompt": "Generate 5 quotes about work-life balance",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66\#related-templates)    Related Templates

- [Tweet Card with Minimal Style](https://help.blotato.com/api/visuals/ba413be6-a840-4e60-8fd6-0066d3b427df)

- [Quote Card with Paper Background](https://help.blotato.com/api/visuals/f941e306-76f7-45da-b3d9-7463af630e91)


## [hashtag](https://help.blotato.com/api/visuals/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousTweet Card with Minimal Stylechevron-left](https://help.blotato.com/api/visuals/ba413be6-a840-4e60-8fd6-0066d3b427df) [NextTutorial Carousel with Minimalist Flat Stylechevron-right](https://help.blotato.com/api/visuals/2491f97b-1b47-4efa-8b96-8c651fa7b3d5)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Tutorial Carousel with Minimalist Flat Style | Blotato Help
URL: https://help.blotato.com/api/visuals/2491f97b-1b47-4efa-8b96-8c651fa7b3d5

Create step-by-step tutorial carousels with a minimalist flat design style.

## [hashtag](https://help.blotato.com/api/visuals/2491f97b-1b47-4efa-8b96-8c651fa7b3d5\#when-to-use-this-template)    When to Use This Template

- You are creating step-by-step educational or how-to carousels

- You want a structured format with a title slide, numbered content slides, and a CTA slide with your profile info

- Popular format for LinkedIn and Instagram carousels in business, marketing, and tech education

- Includes built-in CTA buttons (e.g., "Follow for more tips", "Share", "Bookmark") and a profile slide


## [hashtag](https://help.blotato.com/api/visuals/2491f97b-1b47-4efa-8b96-8c651fa7b3d5\#template-information)    Template Information

Property

Value

Template ID

`/base/v2/tutorial-carousel/2491f97b-1b47-4efa-8b96-8c651fa7b3d5/v1`

Output Type

Slideshow

Category

Tutorial Carousels

## [hashtag](https://help.blotato.com/api/visuals/2491f97b-1b47-4efa-8b96-8c651fa7b3d5\#parameters)    Parameters

Parameter

Type

Required

Default

Description

font

enum

No

font-sans

Font family. 24 options available

mainTitle

string

Yes

3 Ways to Grow Faster on Instagram

Main title. 5-50 chars

authorName

string

Yes

Alex Hormozi

Author name. Max: 60 chars

ctaButtonText

string

Yes

Swipe Right

CTA button text. Max: 50 chars

contentItems

array

Yes

-

Content items. Min: 1. Each: 10-300 chars

backgroundColor

color

No

#F5D5C8

Main background color

borderColor

color

No

#000000

Border frame color

textColor

color

No

#000000

Main text color

ctaTitle

string

Yes

Share your thoughts in comments below

CTA title. 5-150 chars

ctaActions

array

Yes

-

Action buttons. Min: 1, Max: 100. Each: 1-50 chars

profileName

string

Yes

Alex Hormozi

Profile name. Max: 60 chars

profileTitle

string

Yes

Brand Strategist

Profile title. Max: 80 chars

profileDescription

string

Yes

-

Profile description. 10-250 chars

profileCta

string

Yes

Follow for more tips

Profile CTA. Max: 50 chars

profileImage

image

No

-

Profile image URL

aspectRatio

enum

No

1:1

Values: 1:1, 4:5, 9:16

## [hashtag](https://help.blotato.com/api/visuals/2491f97b-1b47-4efa-8b96-8c651fa7b3d5\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/tutorial-carousel/2491f97b-1b47-4efa-8b96-8c651fa7b3d5/v1",
  "inputs": {},
  "prompt": "Create a tutorial carousel about 5 ways to improve your LinkedIn profile for job seekers",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/2491f97b-1b47-4efa-8b96-8c651fa7b3d5\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/tutorial-carousel/2491f97b-1b47-4efa-8b96-8c651fa7b3d5/v1",
  "inputs": {
    "mainTitle": "3 Ways to Grow Faster on Instagram",
    "authorName": "Alex Hormozi",
    "ctaButtonText": "Swipe Right",
    "contentItems": [\
      "Stop chasing vanity metrics. Focus on getting 100 true fans who buy from you",\
      "Document your process, not results. Show the messy middle where real learning happens",\
      "Reply to every DM for your first 1,000 followers. This builds loyalty money cannot buy"\
    ],
    "backgroundColor": "#F5D5C8",
    "borderColor": "#000000",
    "ctaTitle": "Share your thoughts in comments below",
    "ctaActions": ["Leave a like", "Share to help others", "Bookmark for later"],
    "profileName": "Alex Hormozi",
    "profileTitle": "Brand Strategist",
    "profileDescription": "I share daily posts to help you scale your business 10x faster.",
    "profileCta": "Follow for more tips",
    "aspectRatio": "1:1"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/2491f97b-1b47-4efa-8b96-8c651fa7b3d5\#example-3-hybrid-approach)    Example 3: Hybrid Approach

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/tutorial-carousel/2491f97b-1b47-4efa-8b96-8c651fa7b3d5/v1",
  "inputs": {
    "authorName": "Your Name",
    "profileName": "Your Name",
    "profileTitle": "Your Title",
    "backgroundColor": "#E8F4F8",
    "aspectRatio": "4:5"
  },
  "prompt": "Create a 4-step tutorial about email marketing best practices",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/2491f97b-1b47-4efa-8b96-8c651fa7b3d5\#related-templates)    Related Templates

- [Tutorial Carousel with Monocolor Background](https://help.blotato.com/api/visuals/e095104b-e6c5-4a81-a89d-b0df3d7c5baf)

- [Image Slideshow with Prominent Text](https://help.blotato.com/api/visuals/0ddb8655-c3da-43da-9f7d-be1915ca7818)


## [hashtag](https://help.blotato.com/api/visuals/2491f97b-1b47-4efa-8b96-8c651fa7b3d5\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousTweet Card with Photo/Video Backgroundchevron-left](https://help.blotato.com/api/visuals/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66) [NextTutorial Carousel with Monocolor Backgroundchevron-right](https://help.blotato.com/api/visuals/e095104b-e6c5-4a81-a89d-b0df3d7c5baf)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Tutorial Carousel with Monocolor Background | Blotato Help
URL: https://help.blotato.com/api/visuals/e095104b-e6c5-4a81-a89d-b0df3d7c5baf

Create tutorial carousels with monocolor backgrounds and structured content slides.

## [hashtag](https://help.blotato.com/api/visuals/e095104b-e6c5-4a81-a89d-b0df3d7c5baf\#when-to-use-this-template)    When to Use This Template

- Same structured tutorial format as the minimalist flat style, but with customizable monocolor backgrounds and accent colors

- You want brand-colored tutorial carousels with heading + description per slide

- Includes a hashtag on the intro slide, useful for niche-specific LinkedIn and Instagram content

- Includes a CTA slide with profile image, description, and action buttons


## [hashtag](https://help.blotato.com/api/visuals/e095104b-e6c5-4a81-a89d-b0df3d7c5baf\#template-information)    Template Information

Property

Value

Template ID

`/base/v2/tutorial-carousel/e095104b-e6c5-4a81-a89d-b0df3d7c5baf/v1`

Output Type

Slideshow

Category

Tutorial Carousels

## [hashtag](https://help.blotato.com/api/visuals/e095104b-e6c5-4a81-a89d-b0df3d7c5baf\#parameters)    Parameters

Parameter

Type

Required

Default

Description

font

enum

No

font-sans

Font family. 24 options

hashtag

string

Yes

#personalbranding

Hashtag in upper left. Max: 30 chars

title

string

Yes

3 Ways to Grow Faster on Instagram

Main title. 5-50 chars

introBackgroundColor

color

No

#fe6616

Intro slide background

contentSlides

array

Yes

-

Content slide objects. Min: 1, Max: 100

contentSlides\[\].heading

string

Yes

-

Slide heading. 5-50 chars

contentSlides\[\].description

string

Yes

-

Slide description. 10-400 chars

contentSlides\[\].hasAccentLines

boolean

No

false

Show decorative accent lines

contentBackgroundColor

color

No

#FFFFFF

Content slides background

accentColor

color

No

#fe6616

Accent elements color

authorName

string

Yes

Alex Hormozi

Author name. Max: 60 chars

companyName

string

Yes

@AlexHormozi

Company/handle. Max: 60 chars

ctaGreeting

string

Yes

Hi, I'm Alex

CTA greeting. Max: 80 chars

ctaDescription

string

Yes

-

CTA description. 10-200 chars

ctaButtons

array

Yes

-

Button labels. Min: 1, Max: 100. Each: 1-30 chars

ctaBackgroundColor

color

No

#7217fe

CTA slide background

profileImage

image

No

-

Profile image URL

aspectRatio

enum

No

4:5

Values: 4:5, 1:1, 9:16

## [hashtag](https://help.blotato.com/api/visuals/e095104b-e6c5-4a81-a89d-b0df3d7c5baf\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/tutorial-carousel/e095104b-e6c5-4a81-a89d-b0df3d7c5baf/v1",
  "inputs": {},
  "prompt": "Create a tutorial carousel about 4 steps to start freelancing successfully",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/e095104b-e6c5-4a81-a89d-b0df3d7c5baf\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/tutorial-carousel/e095104b-e6c5-4a81-a89d-b0df3d7c5baf/v1",
  "inputs": {
    "hashtag": "#contentcreation",
    "title": "3 Steps to Better Content",
    "introBackgroundColor": "#fe6616",
    "contentSlides": [\
      {\
        "heading": "Step 1: Research",\
        "description": "Spend 30 minutes each day reading what your audience discusses. Note their pain points and questions.",\
        "hasAccentLines": false\
      },\
      {\
        "heading": "Step 2: Create",\
        "description": "Write content that addresses one specific problem. Keep it actionable and clear.",\
        "hasAccentLines": true\
      }\
    ],
    "authorName": "Alex Hormozi",
    "companyName": "@AlexHormozi",
    "ctaGreeting": "Hi, I'm Alex",
    "ctaDescription": "Follow me for actionable tips on content creation and business!",
    "ctaButtons": ["Repost", "Share"],
    "aspectRatio": "4:5"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/e095104b-e6c5-4a81-a89d-b0df3d7c5baf\#example-3-hybrid-approach)    Example 3: Hybrid Approach

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/tutorial-carousel/e095104b-e6c5-4a81-a89d-b0df3d7c5baf/v1",
  "inputs": {
    "hashtag": "#marketing",
    "authorName": "Your Brand",
    "companyName": "@yourbrand",
    "accentColor": "#3B82F6",
    "ctaBackgroundColor": "#1E40AF"
  },
  "prompt": "Generate a 5-step guide to creating viral TikTok content",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/e095104b-e6c5-4a81-a89d-b0df3d7c5baf\#related-templates)    Related Templates

- [Tutorial Carousel with Minimalist Flat Style](https://help.blotato.com/api/visuals/2491f97b-1b47-4efa-8b96-8c651fa7b3d5)

- [Image Slideshow with Text Overlays](https://help.blotato.com/api/visuals/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f)


## [hashtag](https://help.blotato.com/api/visuals/e095104b-e6c5-4a81-a89d-b0df3d7c5baf\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousTutorial Carousel with Minimalist Flat Stylechevron-left](https://help.blotato.com/api/visuals/2491f97b-1b47-4efa-8b96-8c651fa7b3d5) [NextImage Slideshow with Prominent Textchevron-right](https://help.blotato.com/api/visuals/0ddb8655-c3da-43da-9f7d-be1915ca7818)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Image Slideshow with Prominent Text | Blotato Help
URL: https://help.blotato.com/api/visuals/0ddb8655-c3da-43da-9f7d-be1915ca7818

Create image slideshows with prominent text overlays. 3.2M views, 3,800 likes.

## [hashtag](https://help.blotato.com/api/visuals/0ddb8655-c3da-43da-9f7d-be1915ca7818\#when-to-use-this-template)    When to Use This Template

- You want AI-generated images with large, prominent text overlays for a news-style or story-style carousel

- You are creating "did you know" content, news recaps, or information-heavy slideshows for Instagram or TikTok

- All images are AI-generated from prompts -- you do not upload your own images with this template


## [hashtag](https://help.blotato.com/api/visuals/0ddb8655-c3da-43da-9f7d-be1915ca7818\#template-information)    Template Information

Property

Value

Template ID

`/base/v2/images-with-text/0ddb8655-c3da-43da-9f7d-be1915ca7818/v1`

Output Type

Slideshow

Category

Images with Text

## [hashtag](https://help.blotato.com/api/visuals/0ddb8655-c3da-43da-9f7d-be1915ca7818\#parameters)    Parameters

Parameter

Type

Required

Default

Description

slides

array

Yes

-

Slide objects. Min: 1, Max: 20

slides\[\].image

string

Yes

-

AI prompt to generate image. 20-400 chars

slides\[\].text

string

Yes

-

Text overlay. 30-200 chars

slideDuration

number

No

5

Seconds per slide. Range: 1-10

aspectRatio

enum

No

4:5

Values: 16:9, 1:1, 4:5, 9:16

## [hashtag](https://help.blotato.com/api/visuals/0ddb8655-c3da-43da-9f7d-be1915ca7818\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/images-with-text/0ddb8655-c3da-43da-9f7d-be1915ca7818/v1",
  "inputs": {},
  "prompt": "Create a 4-slide news story about a tech startup that raised $100M in funding",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/0ddb8655-c3da-43da-9f7d-be1915ca7818\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/images-with-text/0ddb8655-c3da-43da-9f7d-be1915ca7818/v1",
  "inputs": {
    "slides": [\
      {\
        "image": "A professional business person at a modern startup office with computers",\
        "text": "Parag Agarwal, removed by Elon Musk as Twitter CEO, built an AI company valued at $740M"\
      },\
      {\
        "image": "Modern tech infrastructure with servers and AI visualization",\
        "text": "After leaving Twitter, he founded Parallel Web Systems. The company builds AI infrastructure for web search."\
      },\
      {\
        "image": "Social media and AI concept with digital connections",\
        "text": "We share informative AI content you will not find anywhere else"\
      }\
    ],
    "slideDuration": 5,
    "aspectRatio": "4:5"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/0ddb8655-c3da-43da-9f7d-be1915ca7818\#example-3-hybrid-approach)    Example 3: Hybrid Approach

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/images-with-text/0ddb8655-c3da-43da-9f7d-be1915ca7818/v1",
  "inputs": {
    "slideDuration": 6,
    "aspectRatio": "9:16"
  },
  "prompt": "Create a 5-slide story about the rise of remote work in tech companies",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/0ddb8655-c3da-43da-9f7d-be1915ca7818\#related-templates)    Related Templates

- [Image Slideshow with Text Overlays](https://help.blotato.com/api/visuals/5903b592-1255-43b4-b9ac-f8ed7cbf6a5f)

- [When X then Y Text Slideshow](https://help.blotato.com/api/visuals/c9892c3b-fa75-4ade-821a-a50ff8456230)


## [hashtag](https://help.blotato.com/api/visuals/0ddb8655-c3da-43da-9f7d-be1915ca7818\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousTutorial Carousel with Monocolor Backgroundchevron-left](https://help.blotato.com/api/visuals/e095104b-e6c5-4a81-a89d-b0df3d7c5baf) [NextWhen X then Y Text Slideshowchevron-right](https://help.blotato.com/api/visuals/c9892c3b-fa75-4ade-821a-a50ff8456230)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# When X then Y Text Slideshow | Blotato Help
URL: https://help.blotato.com/api/visuals/c9892c3b-fa75-4ade-821a-a50ff8456230

Show examples of "When X happens, then Y happens" scenarios with AI-generated images. 2.7M views, 2,700 likes.

## [hashtag](https://help.blotato.com/api/visuals/c9892c3b-fa75-4ade-821a-a50ff8456230\#when-to-use-this-template)    When to Use This Template

- You are creating comparison or "what they say vs. what you should say" content

- Popular format for business tips, negotiation advice, mindset shifts, and before/after scenarios

- You want a structured side-by-side comparison layout with AI-generated images

- Works for coaches, consultants, and educators on TikTok, Instagram, and LinkedIn


## [hashtag](https://help.blotato.com/api/visuals/c9892c3b-fa75-4ade-821a-a50ff8456230\#template-information)    Template Information

Property

Value

Template ID

`/base/v2/images-with-text/c9892c3b-fa75-4ade-821a-a50ff8456230/v1`

Output Type

Video

Category

Images with Text

## [hashtag](https://help.blotato.com/api/visuals/c9892c3b-fa75-4ade-821a-a50ff8456230\#parameters)    Parameters

Parameter

Type

Required

Default

Description

firstSlideText

string

Yes

-

Hook text for first slide. 30-70 chars

firstSlideImagePrompt

string

Yes

-

AI prompt for first slide image. 1-400 chars

comparisonTextTop

string

Yes

-

Top comparison label. 1-50 chars

comparisonTextBottom

string

Yes

-

Bottom comparison label. 1-50 chars

lastSlideText

string

Yes

-

Text for last slide. 1-350 chars

lastSlideImagePrompt

string

Yes

-

AI prompt for last slide image. 1-400 chars

slides

array

Yes

-

Comparison slides. Min: 1, Max: 20

slides\[\].topComparisonExampleText

string

Yes

-

Top example. 20-200 chars

slides\[\].bottomComparisonExampleText

string

Yes

-

Bottom example. 20-200 chars

slideDuration

number

No

5

Seconds per slide. Range: 1-10

aspectRatio

enum

No

4:5

Values: 16:9, 1:1, 4:5, 9:16

## [hashtag](https://help.blotato.com/api/visuals/c9892c3b-fa75-4ade-821a-a50ff8456230\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/images-with-text/c9892c3b-fa75-4ade-821a-a50ff8456230/v1",
  "inputs": {},
  "prompt": "Create a video about negotiation phrases every founder should know, comparing what clients say vs how you should respond",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/c9892c3b-fa75-4ade-821a-a50ff8456230\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/images-with-text/c9892c3b-fa75-4ade-821a-a50ff8456230/v1",
  "inputs": {
    "firstSlideText": "Negotiation phrases every founder should know",
    "firstSlideImagePrompt": "Professional business meeting with two people shaking hands",
    "comparisonTextTop": "When they say:",
    "comparisonTextBottom": "You say:",
    "slides": [\
      {\
        "topComparisonExampleText": "Your pricing does not fit our budget right now",\
        "bottomComparisonExampleText": "Help me understand what you are working with."\
      },\
      {\
        "topComparisonExampleText": "We need to think about it",\
        "bottomComparisonExampleText": "What specific concerns do you want to address?"\
      },\
      {\
        "topComparisonExampleText": "Your competitor is cheaper",\
        "bottomComparisonExampleText": "What would make the extra investment worthwhile for you?"\
      }\
    ],
    "lastSlideText": "Follow for more business tips",
    "lastSlideImagePrompt": "Successful entrepreneur celebrating a closed deal",
    "slideDuration": 5,
    "aspectRatio": "4:5"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/c9892c3b-fa75-4ade-821a-a50ff8456230\#example-3-hybrid-approach)    Example 3: Hybrid Approach

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/images-with-text/c9892c3b-fa75-4ade-821a-a50ff8456230/v1",
  "inputs": {
    "comparisonTextTop": "What beginners think:",
    "comparisonTextBottom": "What experts know:",
    "aspectRatio": "9:16"
  },
  "prompt": "Create a video comparing beginner vs expert mindsets in investing with 4 examples",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/c9892c3b-fa75-4ade-821a-a50ff8456230\#related-templates)    Related Templates

- [Image Slideshow with Prominent Text](https://help.blotato.com/api/visuals/0ddb8655-c3da-43da-9f7d-be1915ca7818)

- [Video of Images and Text with Minimal Style](https://help.blotato.com/api/visuals/3ed4bb92-dbfe-45e6-9dc8-605b77f70506)


## [hashtag](https://help.blotato.com/api/visuals/c9892c3b-fa75-4ade-821a-a50ff8456230\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousImage Slideshow with Prominent Textchevron-left](https://help.blotato.com/api/visuals/0ddb8655-c3da-43da-9f7d-be1915ca7818) [NextVideo of Images and Text with Minimal Stylechevron-right](https://help.blotato.com/api/visuals/3ed4bb92-dbfe-45e6-9dc8-605b77f70506)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Video of Images and Text with Minimal Style | Blotato Help
URL: https://help.blotato.com/api/visuals/3ed4bb92-dbfe-45e6-9dc8-605b77f70506

Create videos combining images and text with minimal styling.

## [hashtag](https://help.blotato.com/api/visuals/3ed4bb92-dbfe-45e6-9dc8-605b77f70506\#when-to-use-this-template)    When to Use This Template

- You have your own images and want to create a video (not a slideshow) that cycles through them — with or without text overlays and a watermark

- You are a photographer, real estate agent, or e-commerce seller who wants to turn product or property images into a video

- You want a branded watermark on the output video (optional — set to empty to remove)


## [hashtag](https://help.blotato.com/api/visuals/3ed4bb92-dbfe-45e6-9dc8-605b77f70506\#template-information)    Template Information

Property

Value

Template ID

`/base/v2/images-with-text/3ed4bb92-dbfe-45e6-9dc8-605b77f70506/v1`

Output Type

Video

Category

Images with Text

## [hashtag](https://help.blotato.com/api/visuals/3ed4bb92-dbfe-45e6-9dc8-605b77f70506\#parameters)    Parameters

Parameter

Type

Required

Default

Description

watemark

string

No

Watemark

Watermark text

textBgColor

color

No

#FFA500

Background color for text

titles

array

No

-

Array of title strings. Max: 100

texts

array

No

-

Array of text strings. Max: 100

images

array

No

-

Array of image URLs. Max: 100

## [hashtag](https://help.blotato.com/api/visuals/3ed4bb92-dbfe-45e6-9dc8-605b77f70506\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/images-with-text/3ed4bb92-dbfe-45e6-9dc8-605b77f70506/v1",
  "inputs": {},
  "prompt": "Create a video showcasing 3 luxury real estate properties with descriptions",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/3ed4bb92-dbfe-45e6-9dc8-605b77f70506\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/images-with-text/3ed4bb92-dbfe-45e6-9dc8-605b77f70506/v1",
  "inputs": {
    "watemark": "@YourBrand",
    "textBgColor": "#FFA500",
    "titles": [\
      "Creative Slide",\
      "Modern Template"\
    ],
    "texts": [\
      "Add engaging content easily and quickly. Capture attention instantly!",\
      "Perfect for social media and presentations. Bring your designs to life with motion text."\
    ],
    "images": [\
      "https://example.com/image1.jpg",\
      "https://example.com/image2.jpg"\
    ]
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/3ed4bb92-dbfe-45e6-9dc8-605b77f70506\#example-3-hybrid-approach)    Example 3: Hybrid Approach

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/images-with-text/3ed4bb92-dbfe-45e6-9dc8-605b77f70506/v1",
  "inputs": {
    "watemark": "@mybrand",
    "textBgColor": "#3B82F6"
  },
  "prompt": "Create a video about 4 tips for better sleep with calming imagery",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/3ed4bb92-dbfe-45e6-9dc8-605b77f70506\#customization-tips)    Customization Tips

All parameters in this template are optional. To hide elements you don't need:

To hide this

Do this

Watermark

Set `watemark` to `""` (empty string). Note: the parameter name is `watemark`, not `watermark`.

Titles

Omit the `titles` parameter, or pass an empty array `[]`

Text overlays

Omit the `texts` parameter, or pass an empty array `[]`

Text background color

Omit `textBgColor` (only visible when titles/texts are present)

If you want a video of your images with no overlays at all, set `watemark` to `""` and omit `titles` and `texts`.

## [hashtag](https://help.blotato.com/api/visuals/3ed4bb92-dbfe-45e6-9dc8-605b77f70506\#related-templates)    Related Templates

- [Image Slideshow with Prominent Text](https://help.blotato.com/api/visuals/0ddb8655-c3da-43da-9f7d-be1915ca7818)

- [When X then Y Text Slideshow](https://help.blotato.com/api/visuals/c9892c3b-fa75-4ade-821a-a50ff8456230)


## [hashtag](https://help.blotato.com/api/visuals/3ed4bb92-dbfe-45e6-9dc8-605b77f70506\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousWhen X then Y Text Slideshowchevron-left](https://help.blotato.com/api/visuals/c9892c3b-fa75-4ade-821a-a50ff8456230) [NextCombine Clips and Apply Basic Editschevron-right](https://help.blotato.com/api/visuals/c306ae43-1dcc-4f45-ac2b-88e75430ffd8)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Combine Clips and Apply Basic Edits | Blotato Help
URL: https://help.blotato.com/api/visuals/c306ae43-1dcc-4f45-ac2b-88e75430ffd8

Stitch video clips together with titles, captions, background music, and transitions.

## [hashtag](https://help.blotato.com/api/visuals/c306ae43-1dcc-4f45-ac2b-88e75430ffd8\#when-to-use-this-template)    When to Use This Template

- You have your own video clips (recorded on your phone, from a camera, or downloaded) and want to stitch them together into one video

- You want to add a title card, auto-generated captions, background music, or transitions to existing footage

- You are a content creator, real estate agent, or business owner who films your own clips and needs light editing before posting to TikTok, Instagram Reels, or YouTube Shorts

- You do NOT need AI to generate any visuals -- you are bringing your own footage


## [hashtag](https://help.blotato.com/api/visuals/c306ae43-1dcc-4f45-ac2b-88e75430ffd8\#template-information)    Template Information

Property

Value

Template ID

`/base/v2/combine-clips/c306ae43-1dcc-4f45-ac2b-88e75430ffd8/v1`

Output Type

Video

Category

Video Editor

## [hashtag](https://help.blotato.com/api/visuals/c306ae43-1dcc-4f45-ac2b-88e75430ffd8\#parameters)    Parameters

Parameter

Type

Required

Default

Description

videoClips

array

Yes

-

Video clips to stitch. Min: 1, Max: 20

videoClips\[\].url

video

Yes

-

URL of video clip

trimSilence

boolean

No

false

Trim silence at start/end

titleConfig

object

No

-

Title overlay configuration

titleConfig.enabled

boolean

No

false

Enable title overlay

titleConfig.text

string

No

Your Title Here

Title text

titleConfig.position

enum

No

top

Values: top, center, bottom

titleConfig.duration

number

No

4

Seconds to display. Range: 1-10

titleConfig.style

enum

No

minimal

Values: minimal, bold, elegant, modern

captionsConfig

object

No

-

Captions configuration

captionsConfig.enabled

boolean

No

false

Enable captions

captionsConfig.style

enum

No

minimal

Values: minimal, bold, highlight, tiktok

captionsConfig.position

enum

No

bottom

Values: top, center, bottom

musicConfig

object

No

-

Background music configuration

musicConfig.enabled

boolean

No

false

Enable background music

musicConfig.url

string

No

-

Music file URL (MP3/WAV)

musicConfig.volume

number

No

30

Volume level. Range: 0-100

transitionConfig

object

No

-

Transition configuration

transitionConfig.type

enum

No

none

Values: none, fade, crossfade, slide, zoom

transitionConfig.duration

number

No

0.5

Seconds. Range: 0-2

maxDuration

number

No

0

Max output duration in seconds. 0 = no limit. Max: 600

aspectRatio

enum

No

9:16

Values: 16:9, 9:16, 1:1, 4:5

## [hashtag](https://help.blotato.com/api/visuals/c306ae43-1dcc-4f45-ac2b-88e75430ffd8\#example-1-basic-clip-combination)    Example 1: Basic Clip Combination

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/combine-clips/c306ae43-1dcc-4f45-ac2b-88e75430ffd8/v1",
  "inputs": {
    "videoClips": [\
      { "url": "https://example.com/clip1.mp4" },\
      { "url": "https://example.com/clip2.mp4" },\
      { "url": "https://example.com/clip3.mp4" }\
    ],
    "aspectRatio": "9:16"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/c306ae43-1dcc-4f45-ac2b-88e75430ffd8\#example-2-full-featured-edit)    Example 2: Full Featured Edit

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/combine-clips/c306ae43-1dcc-4f45-ac2b-88e75430ffd8/v1",
  "inputs": {
    "videoClips": [\
      { "url": "https://example.com/intro.mp4" },\
      { "url": "https://example.com/main-content.mp4" },\
      { "url": "https://example.com/outro.mp4" }\
    ],
    "trimSilence": true,
    "titleConfig": {
      "enabled": true,
      "text": "My Amazing Video",
      "position": "center",
      "duration": 3,
      "style": "bold"
    },
    "captionsConfig": {
      "enabled": true,
      "style": "tiktok",
      "position": "bottom"
    },
    "musicConfig": {
      "enabled": true,
      "url": "https://example.com/background-music.mp3",
      "volume": 25
    },
    "transitionConfig": {
      "type": "crossfade",
      "duration": 0.5
    },
    "maxDuration": 60,
    "aspectRatio": "9:16"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/c306ae43-1dcc-4f45-ac2b-88e75430ffd8\#example-3-with-captions-and-transitions)    Example 3: With Captions and Transitions

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/combine-clips/c306ae43-1dcc-4f45-ac2b-88e75430ffd8/v1",
  "inputs": {
    "videoClips": [\
      { "url": "https://example.com/clip1.mp4" },\
      { "url": "https://example.com/clip2.mp4" }\
    ],
    "captionsConfig": {
      "enabled": true,
      "style": "highlight",
      "position": "center"
    },
    "transitionConfig": {
      "type": "fade",
      "duration": 0.8
    },
    "aspectRatio": "1:1"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/c306ae43-1dcc-4f45-ac2b-88e75430ffd8\#related-templates)    Related Templates

- [AI Video with AI Voice](https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd)

- [AI Avatar with AI Generated B-roll](https://help.blotato.com/api/visuals/7c26a1cd-d5b3-42da-9c73-2413333873b3)


## [hashtag](https://help.blotato.com/api/visuals/c306ae43-1dcc-4f45-ac2b-88e75430ffd8\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousVideo of Images and Text with Minimal Stylechevron-left](https://help.blotato.com/api/visuals/3ed4bb92-dbfe-45e6-9dc8-605b77f70506) [NextAI Video with AI Voicechevron-right](https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# AI Video with AI Voice | Blotato Help
URL: https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd

Create AI-narrated videos with generated or uploaded media. 8.9M views, trending template.

## [hashtag](https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd\#when-to-use-this-template)    When to Use This Template

- You have a script or topic and want Blotato to generate a full video with AI images, voiceover, and captions

- You want to create faceless story videos, educational explainers, or narrated content without filming yourself

- You are making content for TikTok, Instagram Reels, or YouTube Shorts and need AI to handle image generation and voiceover

- You want to upload your own media for some scenes and use AI-generated images for others (hybrid approach)

- Use advanced options to control the exact image prompt and voiceover script per scene


## [hashtag](https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd\#template-information)    Template Information

Property

Value

Template ID

`/base/v2/ai-story-video/5903fe43-514d-40ee-a060-0d6628c5f8fd/v1`

Output Type

Video

Category

AI Videos

## [hashtag](https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd\#parameters)    Parameters

Parameter

Type

Required

Default

Description

scenes

array

Yes

-

Scene objects. Min: 1, Max: 20

scenes\[\].mediaSource

union

Yes

-

Upload video URL or AI prompt for image generation

scenes\[\].script

string

Yes

-

Voiceover text for this scene

voiceName

enum

No

Brian (American, deep)

ElevenLabs voice. See voice options below

aiImageModel

enum

No

fal-ai/imagen4/preview/fast

AI model for image generation. See values below

animateAiImages

boolean

No

false

Convert AI images to animated videos

captionPosition

enum

No

center

Values: top, center, bottom

highlightColor

color

No

#FFFF00

Highlighted word color in captions

transition

enum

No

none

Values: none, fade, slide, zoom

aspectRatio

enum

No

9:16

Values: 16:9, 1:1, 4:5, 9:16

trimToVoiceover

boolean

No

true

Trim video to match voiceover duration

### [hashtag](https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd\#available-ai-image-models)    Available AI Image Models

Pass one of these values as `aiImageModel` to control which AI model generates your images. Each model has a different credit cost. See [AI Video Credits](https://help.blotato.com/features/videos/ai-video-credits) for pricing.

Value

Label

Credits/Image

`replicate/black-forest-labs/flux-schnell`

Cheapest

1

`replicate/black-forest-labs/flux-dev`

Good

10

`replicate/black-forest-labs/flux-1.1-pro`

Great

15

`replicate/black-forest-labs/flux-1.1-pro-ultra`

Best for Images

20

`replicate/recraft-ai/recraft-v3`

Best for Realistic Image

15

`replicate/ideogram-ai/ideogram-v2`

Best for Text

30

`replicate/luma/photon`

Good

10

`openai/gpt-image-1`

OpenAI GPT Image

25

`fal-ai/nano-banana`

Nano Banana

15

`fal-ai/nano-banana/edit`

Nano Banana Edit

15

`fal-ai/nano-banana-pro`

Nano Banana Pro

50

`fal-ai/nano-banana-pro/edit`

Nano Banana Pro Edit

50

`fal-ai/imagen4/preview/fast`

Imagen 4 Fast (default)

7

`fal-ai/bytedance/seedream/v4.5/text-to-image`

Seedream v4.5

15

`fal-ai/bytedance/seedream/v4.5/edit`

Seedream v4.5 Edit

15

### [hashtag](https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd\#available-voices)    Available Voices

Alice (British, confident), Aria (American, expressive), Bill (American, trustworthy), Brian (American, deep), Callum (Transatlantic, intense), Charlie (Australian, natural), Charlotte (Swedish, seductive), Chris (American, casual), Daniel (British, authoritative), Eric (American, friendly), George (British, warm), Jessica (American, expressive), Laura (American, upbeat), Liam (American, articulate), Lily (British, warm), Matilda (American, friendly), River (American, confident), Roger (American, confident), Sarah (American, soft), Will (American, friendly)

## [hashtag](https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/ai-story-video/5903fe43-514d-40ee-a060-0d6628c5f8fd/v1",
  "inputs": {},
  "prompt": "Create a 3-scene video about the history of coffee, from ancient Ethiopia to modern cafes",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/ai-story-video/5903fe43-514d-40ee-a060-0d6628c5f8fd/v1",
  "inputs": {
    "scenes": [\
      {\
        "mediaSource": "A serene winter landscape with snow-covered mountains and a frozen lake",\
        "script": "Welcome to this amazing journey. Let me show you something incredible."\
      },\
      {\
        "mediaSource": "A golden retriever playing happily in a sunny meadow",\
        "script": "Every moment is an opportunity to create something beautiful."\
      },\
      {\
        "mediaSource": "A cozy coffee shop interior with warm lighting and books",\
        "script": "And remember, the best stories are yet to be told."\
      }\
    ],
    "voiceName": "Brian (American, deep)",
    "captionPosition": "center",
    "highlightColor": "#FFFF00",
    "transition": "fade",
    "aspectRatio": "9:16"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd\#example-3-hybrid-with-custom-voice)    Example 3: Hybrid with Custom Voice

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/ai-story-video/5903fe43-514d-40ee-a060-0d6628c5f8fd/v1",
  "inputs": {
    "voiceName": "Alice (British, confident)",
    "captionPosition": "bottom",
    "highlightColor": "#00FF00",
    "animateAiImages": true,
    "aspectRatio": "1:1"
  },
  "prompt": "Create a 4-scene video about the benefits of meditation for busy professionals",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd\#example-4-mixed-media-sources)    Example 4: Mixed Media Sources

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/ai-story-video/5903fe43-514d-40ee-a060-0d6628c5f8fd/v1",
  "inputs": {
    "scenes": [\
      {\
        "mediaSource": "https://example.com/my-uploaded-video.mp4",\
        "script": "Here is my introduction using uploaded footage."\
      },\
      {\
        "mediaSource": "A futuristic cityscape with flying cars and neon lights",\
        "script": "Now imagine what the future could look like."\
      }\
    ],
    "voiceName": "Daniel (British, authoritative)",
    "aspectRatio": "16:9"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd\#related-templates)    Related Templates

- [AI Selfie Talking Video](https://help.blotato.com/api/visuals/57f5a565-fd17-458b-be43-4a2d8ccaca75)

- [AI Avatar with AI Generated B-roll](https://help.blotato.com/api/visuals/7c26a1cd-d5b3-42da-9c73-2413333873b3)

- [Combine Clips and Apply Basic Edits](https://help.blotato.com/api/visuals/c306ae43-1dcc-4f45-ac2b-88e75430ffd8)


## [hashtag](https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [Voice IDs Reference](https://help.blotato.com/api/accounts/voice-ids)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousCombine Clips and Apply Basic Editschevron-left](https://help.blotato.com/api/visuals/c306ae43-1dcc-4f45-ac2b-88e75430ffd8) [NextAI Selfie Talking Video with Consistent Characterchevron-right](https://help.blotato.com/api/visuals/57f5a565-fd17-458b-be43-4a2d8ccaca75)

Last updated 4 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# AI Selfie Talking Video with Consistent Character | Blotato Help
URL: https://help.blotato.com/api/visuals/57f5a565-fd17-458b-be43-4a2d8ccaca75

Create AI-generated selfie-style talking videos with a consistent character across all scenes.

## [hashtag](https://help.blotato.com/api/visuals/57f5a565-fd17-458b-be43-4a2d8ccaca75\#when-to-use-this-template)    When to Use This Template

- You want a consistent AI-generated character (not your real face) appearing across all scenes

- You are creating POV-style, vlog-style, or first-person narration videos where a character "talks to the camera"

- You want to experiment with different art styles (realistic, anime, watercolor, cyberpunk) for your character

- You do not want to show your face on camera but want a character-driven video for TikTok or Instagram


## [hashtag](https://help.blotato.com/api/visuals/57f5a565-fd17-458b-be43-4a2d8ccaca75\#template-information)    Template Information

Property

Value

Template ID

`/base/v2/ai-selfie-video/57f5a565-fd17-458b-be43-4a2d8ccaca75/v1`

Output Type

Video

Category

AI Videos

## [hashtag](https://help.blotato.com/api/visuals/57f5a565-fd17-458b-be43-4a2d8ccaca75\#parameters)    Parameters

Parameter

Type

Required

Default

Description

scenes

array

Yes

-

Scene objects. Min: 1, Max: 100

scenes\[\].description

string

Yes

-

Visual description of the scene

scenes\[\].narration

string

Yes

-

Narration text for the scene

style

enum

No

realistic

Visual style. Values: realistic, cartoon, anime, watercolor, oil-painting, sketch, cyberpunk, fantasy, minimalist

characterDescription

union

Yes

-

Text description or image reference of character

aspectRatio

enum

No

9:16

Values: 16:9, 9:16, 1:1

## [hashtag](https://help.blotato.com/api/visuals/57f5a565-fd17-458b-be43-4a2d8ccaca75\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/ai-selfie-video/57f5a565-fd17-458b-be43-4a2d8ccaca75/v1",
  "inputs": {},
  "prompt": "Create a 3-scene travel vlog style video of a young adventurer exploring ancient temples in Southeast Asia",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/57f5a565-fd17-458b-be43-4a2d8ccaca75\#example-2-manual-inputs-with-text-description)    Example 2: Manual Inputs with Text Description

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/ai-selfie-video/57f5a565-fd17-458b-be43-4a2d8ccaca75/v1",
  "inputs": {
    "scenes": [\
      {\
        "description": "A lone traveler stands at the edge of a misty cliff, looking out at the vast ocean below",\
        "narration": "Welcome to my journey. I will take you through some of the most breathtaking places I have ever seen."\
      },\
      {\
        "description": "The traveler walks through an ancient forest with towering trees and dappled sunlight",\
        "narration": "This forest is one of my favorite spots. The light filtering through the leaves is magical."\
      },\
      {\
        "description": "A mysterious temple appears through the fog, its entrance glowing with soft golden light",\
        "narration": "And here we are at the ancient temple. It has been standing for centuries, holding countless stories."\
      }\
    ],
    "style": "realistic",
    "characterDescription": "A young adventurer wearing a weathered cloak and carrying an old leather backpack",
    "aspectRatio": "9:16"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/57f5a565-fd17-458b-be43-4a2d8ccaca75\#example-3-with-image-reference)    Example 3: With Image Reference

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/ai-selfie-video/57f5a565-fd17-458b-be43-4a2d8ccaca75/v1",
  "inputs": {
    "scenes": [\
      {\
        "description": "Character standing in a modern office with city skyline visible through windows",\
        "narration": "Welcome to my channel! Today I am sharing my productivity tips."\
      },\
      {\
        "description": "Character at a coffee shop with laptop and notebook",\
        "narration": "First tip: always start your day with a clear plan."\
      }\
    ],
    "style": "realistic",
    "characterDescription": "https://example.com/my-character-reference.jpg",
    "aspectRatio": "9:16"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/57f5a565-fd17-458b-be43-4a2d8ccaca75\#example-4-anime-style)    Example 4: Anime Style

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/ai-selfie-video/57f5a565-fd17-458b-be43-4a2d8ccaca75/v1",
  "inputs": {
    "style": "anime",
    "characterDescription": "A cheerful anime girl with pink hair and school uniform",
    "aspectRatio": "9:16"
  },
  "prompt": "Create a 3-scene video about studying tips for students",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/57f5a565-fd17-458b-be43-4a2d8ccaca75\#related-templates)    Related Templates

- [AI Video with AI Voice](https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd)

- [AI Avatar with AI Generated B-roll](https://help.blotato.com/api/visuals/7c26a1cd-d5b3-42da-9c73-2413333873b3)


## [hashtag](https://help.blotato.com/api/visuals/57f5a565-fd17-458b-be43-4a2d8ccaca75\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousAI Video with AI Voicechevron-left](https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd) [NextAI Avatar with AI Generated B-rollchevron-right](https://help.blotato.com/api/visuals/7c26a1cd-d5b3-42da-9c73-2413333873b3)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# AI Avatar with AI Generated B-roll | Blotato Help
URL: https://help.blotato.com/api/visuals/7c26a1cd-d5b3-42da-9c73-2413333873b3

Create AI avatar videos with automatically generated B-roll footage that complements the narration.

## [hashtag](https://help.blotato.com/api/visuals/7c26a1cd-d5b3-42da-9c73-2413333873b3\#when-to-use-this-template)    When to Use This Template

- You have a talking head video (from HeyGen, a webcam, or your phone) and want to add AI-generated b-roll footage that matches your narration

- You are a coach, educator, or thought leader who records yourself speaking and wants to make the video more engaging with relevant visuals

- You want to enhance existing avatar or webcam footage for LinkedIn, YouTube, or Instagram without manually sourcing b-roll


## [hashtag](https://help.blotato.com/api/visuals/7c26a1cd-d5b3-42da-9c73-2413333873b3\#template-information)    Template Information

Property

Value

Template ID

`/base/v2/ai-avatar-broll/7c26a1cd-d5b3-42da-9c73-2413333873b3/v1`

Output Type

Video

Category

AI Avatar

## [hashtag](https://help.blotato.com/api/visuals/7c26a1cd-d5b3-42da-9c73-2413333873b3\#parameters)    Parameters

Parameter

Type

Required

Default

Description

avatarVideoUrl

video

Yes

-

Video URL of avatar speaking the narration

## [hashtag](https://help.blotato.com/api/visuals/7c26a1cd-d5b3-42da-9c73-2413333873b3\#how-it-works)    How It Works

1. Upload a video of your avatar speaking (e.g., a talking head video)

2. The system analyzes the narration and automatically generates relevant B-roll footage

3. The B-roll is intelligently cut into the avatar video to create an engaging final product


## [hashtag](https://help.blotato.com/api/visuals/7c26a1cd-d5b3-42da-9c73-2413333873b3\#example-1-basic-usage)    Example 1: Basic Usage

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/ai-avatar-broll/7c26a1cd-d5b3-42da-9c73-2413333873b3/v1",
  "inputs": {
    "avatarVideoUrl": "https://example.com/my-avatar-speaking.mp4"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/7c26a1cd-d5b3-42da-9c73-2413333873b3\#example-2-with-hosted-video)    Example 2: With Hosted Video

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/base/v2/ai-avatar-broll/7c26a1cd-d5b3-42da-9c73-2413333873b3/v1",
  "inputs": {
    "avatarVideoUrl": "https://storage.example.com/videos/talking-head-video.mp4"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/7c26a1cd-d5b3-42da-9c73-2413333873b3\#tips-for-best-results)    Tips for Best Results

1. Record a clear talking head video with good audio quality

2. Speak at a moderate pace to allow for B-roll insertion

3. Use natural pauses in your narration

4. Ensure consistent lighting and framing in your avatar video


## [hashtag](https://help.blotato.com/api/visuals/7c26a1cd-d5b3-42da-9c73-2413333873b3\#related-templates)    Related Templates

- [AI Video with AI Voice](https://help.blotato.com/api/visuals/5903fe43-514d-40ee-a060-0d6628c5f8fd)

- [AI Selfie Talking Video](https://help.blotato.com/api/visuals/57f5a565-fd17-458b-be43-4a2d8ccaca75)

- [Combine Clips and Apply Basic Edits](https://help.blotato.com/api/visuals/c306ae43-1dcc-4f45-ac2b-88e75430ffd8)


## [hashtag](https://help.blotato.com/api/visuals/7c26a1cd-d5b3-42da-9c73-2413333873b3\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousAI Selfie Talking Video with Consistent Characterchevron-left](https://help.blotato.com/api/visuals/57f5a565-fd17-458b-be43-4a2d8ccaca75) [NextTV Wall Infographicchevron-right](https://help.blotato.com/api/visuals/013904bf-6b3b-43f4-bb1f-f1964a38c29b)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# TV Wall Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/013904bf-6b3b-43f4-bb1f-f1964a38c29b

Generate an infographic displayed across a massive 32x32 grid of TV screens, creating a stunning video wall installation effect.

## [hashtag](https://help.blotato.com/api/visuals/013904bf-6b3b-43f4-bb1f-f1964a38c29b\#template-information)    Template Information

Property

Value

Template ID

`/video-template/013904bf-6b3b-43f4-bb1f-f1964a38c29b`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/013904bf-6b3b-43f4-bb1f-f1964a38c29b\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text at the bottom of the image. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/013904bf-6b3b-43f4-bb1f-f1964a38c29b\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/013904bf-6b3b-43f4-bb1f-f1964a38c29b",
  "inputs": {},
  "prompt": "Create an infographic about the benefits of remote work",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/013904bf-6b3b-43f4-bb1f-f1964a38c29b\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/013904bf-6b3b-43f4-bb1f-f1964a38c29b",
  "inputs": {
    "description": "5 Ways AI is Transforming Healthcare: From early diagnosis to personalized treatment plans, AI is revolutionizing medicine",
    "footerText": "Follow @HealthTech for more insights"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/013904bf-6b3b-43f4-bb1f-f1964a38c29b\#related-templates)    Related Templates

- [Newspaper Infographic](https://help.blotato.com/api/visuals/07a5b5c5-387c-49e3-86b1-de822cd2dfc7)

- [Breaking News](https://help.blotato.com/api/visuals/8800be71-52df-4ac7-ac94-df9d8a494d0f)

- [Movie Theater Infographic](https://help.blotato.com/api/visuals/f8f1ebe4-a9f5-4ec8-be63-21214656cd4b)


## [hashtag](https://help.blotato.com/api/visuals/013904bf-6b3b-43f4-bb1f-f1964a38c29b\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousAI Avatar with AI Generated B-rollchevron-left](https://help.blotato.com/api/visuals/7c26a1cd-d5b3-42da-9c73-2413333873b3) [NextNewspaper Infographicchevron-right](https://help.blotato.com/api/visuals/07a5b5c5-387c-49e3-86b1-de822cd2dfc7)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Newspaper Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/07a5b5c5-387c-49e3-86b1-de822cd2dfc7

Generate a classic newspaper-style infographic image with masthead, columns, and headlines using AI image generation.

## [hashtag](https://help.blotato.com/api/visuals/07a5b5c5-387c-49e3-86b1-de822cd2dfc7\#template-information)    Template Information

Property

Value

Template ID

`/video-template/07a5b5c5-387c-49e3-86b1-de822cd2dfc7`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/07a5b5c5-387c-49e3-86b1-de822cd2dfc7\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text at the bottom of the image. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/07a5b5c5-387c-49e3-86b1-de822cd2dfc7\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/07a5b5c5-387c-49e3-86b1-de822cd2dfc7",
  "inputs": {},
  "prompt": "Create a newspaper-style article about rising coffee prices",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/07a5b5c5-387c-49e3-86b1-de822cd2dfc7\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/07a5b5c5-387c-49e3-86b1-de822cd2dfc7",
  "inputs": {
    "description": "BREAKING: New Study Reveals Morning Routines of Highly Successful People - Wake up early, exercise, and practice gratitude",
    "footerText": "Subscribe for daily insights"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/07a5b5c5-387c-49e3-86b1-de822cd2dfc7\#related-templates)    Related Templates

- [TV Wall Infographic](https://help.blotato.com/api/visuals/013904bf-6b3b-43f4-bb1f-f1964a38c29b)

- [Breaking News](https://help.blotato.com/api/visuals/8800be71-52df-4ac7-ac94-df9d8a494d0f)

- [Movie Theater Infographic](https://help.blotato.com/api/visuals/f8f1ebe4-a9f5-4ec8-be63-21214656cd4b)


## [hashtag](https://help.blotato.com/api/visuals/07a5b5c5-387c-49e3-86b1-de822cd2dfc7\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousTV Wall Infographicchevron-left](https://help.blotato.com/api/visuals/013904bf-6b3b-43f4-bb1f-f1964a38c29b) [NextBreaking Newschevron-right](https://help.blotato.com/api/visuals/8800be71-52df-4ac7-ac94-df9d8a494d0f)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Breaking News | Blotato Help
URL: https://help.blotato.com/api/visuals/8800be71-52df-4ac7-ac94-df9d8a494d0f

Generate a TV news broadcast style infographic with a professional news anchor, breaking news chyron, and lower third ticker using AI image generation.

## [hashtag](https://help.blotato.com/api/visuals/8800be71-52df-4ac7-ac94-df9d8a494d0f\#template-information)    Template Information

Property

Value

Template ID

`/video-template/8800be71-52df-4ac7-ac94-df9d8a494d0f`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/8800be71-52df-4ac7-ac94-df9d8a494d0f\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text that appears in the news ticker. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/8800be71-52df-4ac7-ac94-df9d8a494d0f\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/8800be71-52df-4ac7-ac94-df9d8a494d0f",
  "inputs": {},
  "prompt": "Create breaking news about a major tech company announcement",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/8800be71-52df-4ac7-ac94-df9d8a494d0f\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/8800be71-52df-4ac7-ac94-df9d8a494d0f",
  "inputs": {
    "description": "BREAKING: Scientists Discover New Method for Clean Energy - Revolutionary solar technology could power entire cities",
    "footerText": "Follow @ScienceNews for updates"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/8800be71-52df-4ac7-ac94-df9d8a494d0f\#related-templates)    Related Templates

- [TV Wall Infographic](https://help.blotato.com/api/visuals/013904bf-6b3b-43f4-bb1f-f1964a38c29b)

- [Newspaper Infographic](https://help.blotato.com/api/visuals/07a5b5c5-387c-49e3-86b1-de822cd2dfc7)

- [Movie Theater Infographic](https://help.blotato.com/api/visuals/f8f1ebe4-a9f5-4ec8-be63-21214656cd4b)


## [hashtag](https://help.blotato.com/api/visuals/8800be71-52df-4ac7-ac94-df9d8a494d0f\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousNewspaper Infographicchevron-left](https://help.blotato.com/api/visuals/07a5b5c5-387c-49e3-86b1-de822cd2dfc7) [NextMovie Theater Infographicchevron-right](https://help.blotato.com/api/visuals/b88c8273-6406-48c6-85e7-096119aefe30)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Movie Theater Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/b88c8273-6406-48c6-85e7-096119aefe30

Generate an infographic illustrated on the pages of an open book, styled like a vintage encyclopedia or beautifully typeset reference book.

## [hashtag](https://help.blotato.com/api/visuals/b88c8273-6406-48c6-85e7-096119aefe30\#template-information)    Template Information

Property

Value

Template ID

`/video-template/b88c8273-6406-48c6-85e7-096119aefe30`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/b88c8273-6406-48c6-85e7-096119aefe30\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text as a footnote. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/b88c8273-6406-48c6-85e7-096119aefe30\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/b88c8273-6406-48c6-85e7-096119aefe30",
  "inputs": {},
  "prompt": "Create an encyclopedia page about ancient civilizations",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/b88c8273-6406-48c6-85e7-096119aefe30\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/b88c8273-6406-48c6-85e7-096119aefe30",
  "inputs": {
    "description": "The Art of Storytelling: From oral traditions to written word, how humans have shared knowledge across generations",
    "footerText": "Continue reading at Library.com"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/b88c8273-6406-48c6-85e7-096119aefe30\#related-templates)    Related Templates

- [Manga Panel Infographic](https://help.blotato.com/api/visuals/49c61370-a706-4b82-98f7-62d557d1c66d)

- [Newspaper Infographic](https://help.blotato.com/api/visuals/07a5b5c5-387c-49e3-86b1-de822cd2dfc7)

- [Single Centered Text Quote](https://help.blotato.com/api/visuals/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0)


## [hashtag](https://help.blotato.com/api/visuals/b88c8273-6406-48c6-85e7-096119aefe30\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousBreaking Newschevron-left](https://help.blotato.com/api/visuals/8800be71-52df-4ac7-ac94-df9d8a494d0f) [NextGraffiti Mural Infographicchevron-right](https://help.blotato.com/api/visuals/3598483b-c148-4276-a800-eede85c1c62f)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Graffiti Mural Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/3598483b-c148-4276-a800-eede85c1c62f

Generate a graffiti mural infographic image that looks like a photograph of massive street art painted on the side of a building in a busy urban area.

## [hashtag](https://help.blotato.com/api/visuals/3598483b-c148-4276-a800-eede85c1c62f\#template-information)    Template Information

Property

Value

Template ID

`/video-template/3598483b-c148-4276-a800-eede85c1c62f`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/3598483b-c148-4276-a800-eede85c1c62f\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text spray-painted at the bottom. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/3598483b-c148-4276-a800-eede85c1c62f\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/3598483b-c148-4276-a800-eede85c1c62f",
  "inputs": {},
  "prompt": "Create a street art infographic about urban sustainability",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/3598483b-c148-4276-a800-eede85c1c62f\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/3598483b-c148-4276-a800-eede85c1c62f",
  "inputs": {
    "description": "Street Art Revolution: How murals are transforming cities and giving communities a voice through public art",
    "footerText": "@UrbanArtDaily | Share the love"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/3598483b-c148-4276-a800-eede85c1c62f\#related-templates)    Related Templates

- [Bus Ad Infographic](https://help.blotato.com/api/visuals/f9c0e470-9288-4958-8cdd-64772ed93c05)

- [Billboard Infographic](https://help.blotato.com/api/visuals/76b3b959-bdbe-440d-8428-984219353f18)

- [T-Shirt Infographic](https://help.blotato.com/api/visuals/476f8920-8749-4ff7-9c91-470d54c3c03e)


## [hashtag](https://help.blotato.com/api/visuals/3598483b-c148-4276-a800-eede85c1c62f\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousMovie Theater Infographicchevron-left](https://help.blotato.com/api/visuals/b88c8273-6406-48c6-85e7-096119aefe30) [NextBus Ad Infographicchevron-right](https://help.blotato.com/api/visuals/f9c0e470-9288-4958-8cdd-64772ed93c05)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Bus Ad Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/f9c0e470-9288-4958-8cdd-64772ed93c05

Generate an infographic printed as a full bus wrap advertisement on a double decker bus, photographed on a busy city street.

## [hashtag](https://help.blotato.com/api/visuals/f9c0e470-9288-4958-8cdd-64772ed93c05\#template-information)    Template Information

Property

Value

Template ID

`/video-template/f9c0e470-9288-4958-8cdd-64772ed93c05`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/f9c0e470-9288-4958-8cdd-64772ed93c05\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text on the bus wrap. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/f9c0e470-9288-4958-8cdd-64772ed93c05\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/f9c0e470-9288-4958-8cdd-64772ed93c05",
  "inputs": {},
  "prompt": "Create a bus ad about public transportation benefits",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/f9c0e470-9288-4958-8cdd-64772ed93c05\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/f9c0e470-9288-4958-8cdd-64772ed93c05",
  "inputs": {
    "description": "Go Green, Ride the Bus: Reduce your carbon footprint by 75% when you choose public transit over driving alone",
    "footerText": "Learn more at GreenCommute.com"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/f9c0e470-9288-4958-8cdd-64772ed93c05\#related-templates)    Related Templates

- [Graffiti Mural Infographic](https://help.blotato.com/api/visuals/3598483b-c148-4276-a800-eede85c1c62f)

- [Billboard Infographic](https://help.blotato.com/api/visuals/76b3b959-bdbe-440d-8428-984219353f18)

- [T-Shirt Infographic](https://help.blotato.com/api/visuals/476f8920-8749-4ff7-9c91-470d54c3c03e)


## [hashtag](https://help.blotato.com/api/visuals/f9c0e470-9288-4958-8cdd-64772ed93c05\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousGraffiti Mural Infographicchevron-left](https://help.blotato.com/api/visuals/3598483b-c148-4276-a800-eede85c1c62f) [NextBillboard Infographicchevron-right](https://help.blotato.com/api/visuals/76b3b959-bdbe-440d-8428-984219353f18)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Billboard Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/76b3b959-bdbe-440d-8428-984219353f18

Generate a billboard-style infographic that looks like a giant outdoor billboard being constructed by workers, with bold impactful text visible from far away.

## [hashtag](https://help.blotato.com/api/visuals/76b3b959-bdbe-440d-8428-984219353f18\#template-information)    Template Information

Property

Value

Template ID

`/video-template/76b3b959-bdbe-440d-8428-984219353f18`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/76b3b959-bdbe-440d-8428-984219353f18\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text printed on the billboard. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/76b3b959-bdbe-440d-8428-984219353f18\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/76b3b959-bdbe-440d-8428-984219353f18",
  "inputs": {},
  "prompt": "Create a billboard about career growth tips",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/76b3b959-bdbe-440d-8428-984219353f18\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/76b3b959-bdbe-440d-8428-984219353f18",
  "inputs": {
    "description": "Your Future Starts Today: 3 Skills Every Professional Needs - Leadership, Communication, Adaptability",
    "footerText": "Visit CareerBoost.io"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/76b3b959-bdbe-440d-8428-984219353f18\#related-templates)    Related Templates

- [Graffiti Mural Infographic](https://help.blotato.com/api/visuals/3598483b-c148-4276-a800-eede85c1c62f)

- [Bus Ad Infographic](https://help.blotato.com/api/visuals/f9c0e470-9288-4958-8cdd-64772ed93c05)

- [T-Shirt Infographic](https://help.blotato.com/api/visuals/476f8920-8749-4ff7-9c91-470d54c3c03e)


## [hashtag](https://help.blotato.com/api/visuals/76b3b959-bdbe-440d-8428-984219353f18\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousBus Ad Infographicchevron-left](https://help.blotato.com/api/visuals/f9c0e470-9288-4958-8cdd-64772ed93c05) [NextClassroom Chalkboard Infographicchevron-right](https://help.blotato.com/api/visuals/d9495026-3945-44f6-8b44-07c28c492e6d)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Classroom Chalkboard Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/d9495026-3945-44f6-8b44-07c28c492e6d

Generate a classroom chalkboard infographic image with a teacher explaining content drawn in colored chalk, photographed from the back of a classroom full of students.

## [hashtag](https://help.blotato.com/api/visuals/d9495026-3945-44f6-8b44-07c28c492e6d\#template-information)    Template Information

Property

Value

Template ID

`/video-template/d9495026-3945-44f6-8b44-07c28c492e6d`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/d9495026-3945-44f6-8b44-07c28c492e6d\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text at the bottom of the chalkboard. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/d9495026-3945-44f6-8b44-07c28c492e6d\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/d9495026-3945-44f6-8b44-07c28c492e6d",
  "inputs": {},
  "prompt": "Create a classroom lesson about the solar system",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/d9495026-3945-44f6-8b44-07c28c492e6d\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/d9495026-3945-44f6-8b44-07c28c492e6d",
  "inputs": {
    "description": "The Scientific Method: Observation, Hypothesis, Experiment, Analysis, Conclusion - How great discoveries are made",
    "footerText": "Follow @ScienceClass for more lessons"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/d9495026-3945-44f6-8b44-07c28c492e6d\#related-templates)    Related Templates

- [Whiteboard Infographic](https://help.blotato.com/api/visuals/ae868019-820d-434c-8fe1-74c9da99129a)

- [Chalkboard Infographic](https://help.blotato.com/api/visuals/fcd64907-b103-46f8-9f75-51b9d1a522f5)

- [Book Page Infographic](https://help.blotato.com/api/visuals/b88c8273-6406-48c6-85e7-096119aefe30)


## [hashtag](https://help.blotato.com/api/visuals/d9495026-3945-44f6-8b44-07c28c492e6d\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousBillboard Infographicchevron-left](https://help.blotato.com/api/visuals/76b3b959-bdbe-440d-8428-984219353f18) [NextWhiteboard Infographicchevron-right](https://help.blotato.com/api/visuals/ae868019-820d-434c-8fe1-74c9da99129a)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Whiteboard Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/ae868019-820d-434c-8fe1-74c9da99129a

Generate a whiteboard infographic image based on a detailed text description using AI image generation.

## [hashtag](https://help.blotato.com/api/visuals/ae868019-820d-434c-8fe1-74c9da99129a\#template-information)    Template Information

Property

Value

Template ID

`/video-template/ae868019-820d-434c-8fe1-74c9da99129a`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/ae868019-820d-434c-8fe1-74c9da99129a\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text at the bottom of the whiteboard. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/ae868019-820d-434c-8fe1-74c9da99129a\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/ae868019-820d-434c-8fe1-74c9da99129a",
  "inputs": {},
  "prompt": "Create a whiteboard diagram explaining agile methodology",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/ae868019-820d-434c-8fe1-74c9da99129a\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/ae868019-820d-434c-8fe1-74c9da99129a",
  "inputs": {
    "description": "Project Management 101: Plan, Execute, Monitor, Close - The four phases every successful project follows",
    "footerText": "Save this for later!"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/ae868019-820d-434c-8fe1-74c9da99129a\#related-templates)    Related Templates

- [Classroom Chalkboard Infographic](https://help.blotato.com/api/visuals/d9495026-3945-44f6-8b44-07c28c492e6d)

- [Chalkboard Infographic](https://help.blotato.com/api/visuals/fcd64907-b103-46f8-9f75-51b9d1a522f5)

- [Book Page Infographic](https://help.blotato.com/api/visuals/b88c8273-6406-48c6-85e7-096119aefe30)


## [hashtag](https://help.blotato.com/api/visuals/ae868019-820d-434c-8fe1-74c9da99129a\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousClassroom Chalkboard Infographicchevron-left](https://help.blotato.com/api/visuals/d9495026-3945-44f6-8b44-07c28c492e6d) [NextChalkboard Infographicchevron-right](https://help.blotato.com/api/visuals/fcd64907-b103-46f8-9f75-51b9d1a522f5)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Chalkboard Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/fcd64907-b103-46f8-9f75-51b9d1a522f5

Generate a chalkboard-style infographic image based on a detailed text description using AI image generation.

## [hashtag](https://help.blotato.com/api/visuals/fcd64907-b103-46f8-9f75-51b9d1a522f5\#template-information)    Template Information

Property

Value

Template ID

`/video-template/fcd64907-b103-46f8-9f75-51b9d1a522f5`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/fcd64907-b103-46f8-9f75-51b9d1a522f5\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text at the bottom of the chalkboard. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/fcd64907-b103-46f8-9f75-51b9d1a522f5\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/fcd64907-b103-46f8-9f75-51b9d1a522f5",
  "inputs": {},
  "prompt": "Create a chalkboard infographic about healthy eating habits",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/fcd64907-b103-46f8-9f75-51b9d1a522f5\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/fcd64907-b103-46f8-9f75-51b9d1a522f5",
  "inputs": {
    "description": "The Food Pyramid Reimagined: Vegetables, proteins, whole grains, and healthy fats for optimal nutrition",
    "footerText": "Share with someone who needs this"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/fcd64907-b103-46f8-9f75-51b9d1a522f5\#related-templates)    Related Templates

- [Classroom Chalkboard Infographic](https://help.blotato.com/api/visuals/d9495026-3945-44f6-8b44-07c28c492e6d)

- [Whiteboard Infographic](https://help.blotato.com/api/visuals/ae868019-820d-434c-8fe1-74c9da99129a)

- [Book Page Infographic](https://help.blotato.com/api/visuals/b88c8273-6406-48c6-85e7-096119aefe30)


## [hashtag](https://help.blotato.com/api/visuals/fcd64907-b103-46f8-9f75-51b9d1a522f5\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousWhiteboard Infographicchevron-left](https://help.blotato.com/api/visuals/ae868019-820d-434c-8fe1-74c9da99129a) [NextTrail Marker Infographicchevron-right](https://help.blotato.com/api/visuals/29ebb2bd-02b7-4317-8bb8-c30eb938e47c)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Trail Marker Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/29ebb2bd-02b7-4317-8bb8-c30eb938e47c

Generate an infographic carved into a wooden trail marker in a serene nature setting using AI image generation.

## [hashtag](https://help.blotato.com/api/visuals/29ebb2bd-02b7-4317-8bb8-c30eb938e47c\#template-information)    Template Information

Property

Value

Template ID

`/video-template/29ebb2bd-02b7-4317-8bb8-c30eb938e47c`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/29ebb2bd-02b7-4317-8bb8-c30eb938e47c\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text carved at the bottom. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/29ebb2bd-02b7-4317-8bb8-c30eb938e47c\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/29ebb2bd-02b7-4317-8bb8-c30eb938e47c",
  "inputs": {},
  "prompt": "Create a trail marker about hiking safety tips",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/29ebb2bd-02b7-4317-8bb8-c30eb938e47c\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/29ebb2bd-02b7-4317-8bb8-c30eb938e47c",
  "inputs": {
    "description": "Leave No Trace: Pack it in, pack it out. Stay on marked trails. Respect wildlife. Preserve nature for future generations",
    "footerText": "Explore more at NatureTrails.com"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/29ebb2bd-02b7-4317-8bb8-c30eb938e47c\#related-templates)    Related Templates

- [Constellation Infographic](https://help.blotato.com/api/visuals/5307053e-046b-4c9b-b1ca-38725d2ddcdd)

- [Cave Painting Infographic](https://help.blotato.com/api/visuals/82ee75b6-597b-43a8-86bc-e4395e7c9c44)


## [hashtag](https://help.blotato.com/api/visuals/29ebb2bd-02b7-4317-8bb8-c30eb938e47c\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousChalkboard Infographicchevron-left](https://help.blotato.com/api/visuals/fcd64907-b103-46f8-9f75-51b9d1a522f5) [NextConstellation Infographicchevron-right](https://help.blotato.com/api/visuals/5307053e-046b-4c9b-b1ca-38725d2ddcdd)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Constellation Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/5307053e-046b-4c9b-b1ca-38725d2ddcdd

Generate a constellation-style infographic on a breathtaking starry night sky, where data points become stars connected by glowing constellation lines.

## [hashtag](https://help.blotato.com/api/visuals/5307053e-046b-4c9b-b1ca-38725d2ddcdd\#template-information)    Template Information

Property

Value

Template ID

`/video-template/5307053e-046b-4c9b-b1ca-38725d2ddcdd`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/5307053e-046b-4c9b-b1ca-38725d2ddcdd\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text glowing at the horizon. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/5307053e-046b-4c9b-b1ca-38725d2ddcdd\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/5307053e-046b-4c9b-b1ca-38725d2ddcdd",
  "inputs": {},
  "prompt": "Create a celestial map showing the journey of personal growth",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/5307053e-046b-4c9b-b1ca-38725d2ddcdd\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/5307053e-046b-4c9b-b1ca-38725d2ddcdd",
  "inputs": {
    "description": "The Constellation of Success: Vision connects to Action, Action connects to Persistence, Persistence leads to Achievement",
    "footerText": "Reach for the stars"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/5307053e-046b-4c9b-b1ca-38725d2ddcdd\#related-templates)    Related Templates

- [Trail Marker Infographic](https://help.blotato.com/api/visuals/29ebb2bd-02b7-4317-8bb8-c30eb938e47c)

- [Futuristic Flyer](https://help.blotato.com/api/visuals/8fa8545e-8955-4a89-a868-cf45023d6cc5)


## [hashtag](https://help.blotato.com/api/visuals/5307053e-046b-4c9b-b1ca-38725d2ddcdd\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousTrail Marker Infographicchevron-left](https://help.blotato.com/api/visuals/29ebb2bd-02b7-4317-8bb8-c30eb938e47c) [NextManga Panel Infographicchevron-right](https://help.blotato.com/api/visuals/49c61370-a706-4b82-98f7-62d557d1c66d)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Manga Panel Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/49c61370-a706-4b82-98f7-62d557d1c66d

Generate a black and white manga-style panel infographic where characters deliver content through dialogue in classic Japanese comic art style.

## [hashtag](https://help.blotato.com/api/visuals/49c61370-a706-4b82-98f7-62d557d1c66d\#template-information)    Template Information

Property

Value

Template ID

`/video-template/49c61370-a706-4b82-98f7-62d557d1c66d`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/49c61370-a706-4b82-98f7-62d557d1c66d\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text in the final panel. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/49c61370-a706-4b82-98f7-62d557d1c66d\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/49c61370-a706-4b82-98f7-62d557d1c66d",
  "inputs": {},
  "prompt": "Create a manga explaining how to start a side hustle",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/49c61370-a706-4b82-98f7-62d557d1c66d\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/49c61370-a706-4b82-98f7-62d557d1c66d",
  "inputs": {
    "description": "The Art of Productivity: A young professional learns from a wise mentor how to manage time, set priorities, and achieve work-life balance",
    "footerText": "Follow for more life lessons!"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/49c61370-a706-4b82-98f7-62d557d1c66d\#related-templates)    Related Templates

- [T-Shirt Infographic](https://help.blotato.com/api/visuals/476f8920-8749-4ff7-9c91-470d54c3c03e)

- [Book Page Infographic](https://help.blotato.com/api/visuals/b88c8273-6406-48c6-85e7-096119aefe30)

- [Single Centered Text Quote](https://help.blotato.com/api/visuals/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0)


## [hashtag](https://help.blotato.com/api/visuals/49c61370-a706-4b82-98f7-62d557d1c66d\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousConstellation Infographicchevron-left](https://help.blotato.com/api/visuals/5307053e-046b-4c9b-b1ca-38725d2ddcdd) [NextT-Shirt Infographicchevron-right](https://help.blotato.com/api/visuals/476f8920-8749-4ff7-9c91-470d54c3c03e)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# T-Shirt Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/476f8920-8749-4ff7-9c91-470d54c3c03e

Generate an infographic printed on a t-shirt worn by an attractive person using AI image generation.

## [hashtag](https://help.blotato.com/api/visuals/476f8920-8749-4ff7-9c91-470d54c3c03e\#template-information)    Template Information

Property

Value

Template ID

`/video-template/476f8920-8749-4ff7-9c91-470d54c3c03e`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/476f8920-8749-4ff7-9c91-470d54c3c03e\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text on the shirt design. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/476f8920-8749-4ff7-9c91-470d54c3c03e\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/476f8920-8749-4ff7-9c91-470d54c3c03e",
  "inputs": {},
  "prompt": "Create a graphic tee about coffee culture",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/476f8920-8749-4ff7-9c91-470d54c3c03e\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/476f8920-8749-4ff7-9c91-470d54c3c03e",
  "inputs": {
    "description": "Code. Sleep. Repeat. The developer lifestyle - debugging by day, dreaming in syntax by night",
    "footerText": "@DevLife | Wear your passion"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/476f8920-8749-4ff7-9c91-470d54c3c03e\#related-templates)    Related Templates

- [Graffiti Mural Infographic](https://help.blotato.com/api/visuals/3598483b-c148-4276-a800-eede85c1c62f)

- [Manga Panel Infographic](https://help.blotato.com/api/visuals/49c61370-a706-4b82-98f7-62d557d1c66d)

- [Futuristic Flyer](https://help.blotato.com/api/visuals/8fa8545e-8955-4a89-a868-cf45023d6cc5)


## [hashtag](https://help.blotato.com/api/visuals/476f8920-8749-4ff7-9c91-470d54c3c03e\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousManga Panel Infographicchevron-left](https://help.blotato.com/api/visuals/49c61370-a706-4b82-98f7-62d557d1c66d) [NextFuturistic Flyerchevron-right](https://help.blotato.com/api/visuals/8fa8545e-8955-4a89-a868-cf45023d6cc5)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Futuristic Flyer | Blotato Help
URL: https://help.blotato.com/api/visuals/8fa8545e-8955-4a89-a868-cf45023d6cc5

Generate a cyberpunk-inspired futuristic flyer image with neon glow effects, holographic elements, and sci-fi aesthetics using AI image generation.

## [hashtag](https://help.blotato.com/api/visuals/8fa8545e-8955-4a89-a868-cf45023d6cc5\#template-information)    Template Information

Property

Value

Template ID

`/video-template/8fa8545e-8955-4a89-a868-cf45023d6cc5`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/8fa8545e-8955-4a89-a868-cf45023d6cc5\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Flyer topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text with neon styling. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/8fa8545e-8955-4a89-a868-cf45023d6cc5\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/8fa8545e-8955-4a89-a868-cf45023d6cc5",
  "inputs": {},
  "prompt": "Create a cyberpunk flyer about the future of technology",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/8fa8545e-8955-4a89-a868-cf45023d6cc5\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/8fa8545e-8955-4a89-a868-cf45023d6cc5",
  "inputs": {
    "description": "NEURAL LINK 2077: The future of human-computer interaction. Brain implants, augmented reality, digital consciousness",
    "footerText": "Join the revolution at CyberTech.io"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/8fa8545e-8955-4a89-a868-cf45023d6cc5\#related-templates)    Related Templates

- [Steampunk Infographic](https://help.blotato.com/api/visuals/7b7104f1-d277-4993-ad3a-e5883c4b776d)

- [Top Secret Infographic](https://help.blotato.com/api/visuals/b8707b58-a106-44af-bb12-e30507e561af)

- [Constellation Infographic](https://help.blotato.com/api/visuals/5307053e-046b-4c9b-b1ca-38725d2ddcdd)


## [hashtag](https://help.blotato.com/api/visuals/8fa8545e-8955-4a89-a868-cf45023d6cc5\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousT-Shirt Infographicchevron-left](https://help.blotato.com/api/visuals/476f8920-8749-4ff7-9c91-470d54c3c03e) [NextBook Page Infographicchevron-right](https://help.blotato.com/api/visuals/f8f1ebe4-a9f5-4ec8-be63-21214656cd4b)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Book Page Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/f8f1ebe4-a9f5-4ec8-be63-21214656cd4b

Generate an infographic displayed on a giant movie theater screen, photographed from the back rows of a packed cinema audience.

## [hashtag](https://help.blotato.com/api/visuals/f8f1ebe4-a9f5-4ec8-be63-21214656cd4b\#template-information)    Template Information

Property

Value

Template ID

`/video-template/f8f1ebe4-a9f5-4ec8-be63-21214656cd4b`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/f8f1ebe4-a9f5-4ec8-be63-21214656cd4b\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text that appears like movie subtitles. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/f8f1ebe4-a9f5-4ec8-be63-21214656cd4b\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/f8f1ebe4-a9f5-4ec8-be63-21214656cd4b",
  "inputs": {},
  "prompt": "Create a cinematic infographic about the history of filmmaking",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/f8f1ebe4-a9f5-4ec8-be63-21214656cd4b\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/f8f1ebe4-a9f5-4ec8-be63-21214656cd4b",
  "inputs": {
    "description": "The Evolution of Cinema: From silent films to streaming, explore 100 years of movie magic and technological innovation",
    "footerText": "Subscribe for more film history"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/f8f1ebe4-a9f5-4ec8-be63-21214656cd4b\#related-templates)    Related Templates

- [TV Wall Infographic](https://help.blotato.com/api/visuals/013904bf-6b3b-43f4-bb1f-f1964a38c29b)

- [Newspaper Infographic](https://help.blotato.com/api/visuals/07a5b5c5-387c-49e3-86b1-de822cd2dfc7)

- [Breaking News](https://help.blotato.com/api/visuals/8800be71-52df-4ac7-ac94-df9d8a494d0f)


## [hashtag](https://help.blotato.com/api/visuals/f8f1ebe4-a9f5-4ec8-be63-21214656cd4b\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousFuturistic Flyerchevron-left](https://help.blotato.com/api/visuals/8fa8545e-8955-4a89-a868-cf45023d6cc5) [NextSingle Centered Text Quotechevron-right](https://help.blotato.com/api/visuals/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Single Centered Text Quote | Blotato Help
URL: https://help.blotato.com/api/visuals/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0

A simple slideshow with a single centered text quote on a solid background.

## [hashtag](https://help.blotato.com/api/visuals/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0\#template-information)    Template Information

Property

Value

Template ID

`/video-template/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0`

Output Type

Slideshow

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0\#parameters)    Parameters

Parameter

Type

Required

Default

Description

quotes

array

Yes

-

List of quote strings. Each quote becomes a separate card in the carousel. Min: 1, Max: 20

quotes\[\]

string

Yes

-

Individual quote text. Length: 10-350 characters

## [hashtag](https://help.blotato.com/api/visuals/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0",
  "inputs": {},
  "prompt": "Create 5 motivational quotes about perseverance",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0",
  "inputs": {
    "quotes": [\
      "Be careful who you let speak into your life. Not all opinions are qualified.",\
      "People will question your choices...especially the ones too scared to make their own.",\
      "Take advice from people who have receipts, not just opinions.",\
      "Your energy introduces you before you even speak.",\
      "Stop explaining yourself to people who are committed to misunderstanding you."\
    ]
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0\#example-3-single-quote)    Example 3: Single Quote

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0",
  "inputs": {
    "quotes": [\
      "The only way to do great work is to love what you do."\
    ]
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0\#related-templates)    Related Templates

- [Quote Card Monocolor](https://help.blotato.com/api/visuals/77f65d2b-48cc-4adb-bfbb-5bc86f8c01bd)

- [Quote Card Paper + Highlight](https://help.blotato.com/api/visuals/f941e306-76f7-45da-b3d9-7463af630e91)

- [Book Page Infographic](https://help.blotato.com/api/visuals/b88c8273-6406-48c6-85e7-096119aefe30)


## [hashtag](https://help.blotato.com/api/visuals/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousBook Page Infographicchevron-left](https://help.blotato.com/api/visuals/f8f1ebe4-a9f5-4ec8-be63-21214656cd4b) [NextSteampunk Infographicchevron-right](https://help.blotato.com/api/visuals/7b7104f1-d277-4993-ad3a-e5883c4b776d)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Steampunk Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/7b7104f1-d277-4993-ad3a-e5883c4b776d

Generate a steampunk-style infographic image with Victorian-era mechanical aesthetics, clockwork gears, and aged parchment textures using AI image generation.

## [hashtag](https://help.blotato.com/api/visuals/7b7104f1-d277-4993-ad3a-e5883c4b776d\#template-information)    Template Information

Property

Value

Template ID

`/video-template/7b7104f1-d277-4993-ad3a-e5883c4b776d`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/7b7104f1-d277-4993-ad3a-e5883c4b776d\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text on brass nameplate. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/7b7104f1-d277-4993-ad3a-e5883c4b776d\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/7b7104f1-d277-4993-ad3a-e5883c4b776d",
  "inputs": {},
  "prompt": "Create a steampunk blueprint about the mechanics of time travel",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/7b7104f1-d277-4993-ad3a-e5883c4b776d\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/7b7104f1-d277-4993-ad3a-e5883c4b776d",
  "inputs": {
    "description": "The Automaton's Guide to Productivity: Gears of efficiency, springs of motivation, and the clockwork of daily routines",
    "footerText": "Crafted by @VictorianInventor"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/7b7104f1-d277-4993-ad3a-e5883c4b776d\#related-templates)    Related Templates

- [Futuristic Flyer](https://help.blotato.com/api/visuals/8fa8545e-8955-4a89-a868-cf45023d6cc5)

- [Top Secret Infographic](https://help.blotato.com/api/visuals/b8707b58-a106-44af-bb12-e30507e561af)

- [Egyptian Hieroglyph Infographic](https://help.blotato.com/api/visuals/a7b0d128-8478-4b34-9647-a0778b6517d0)


## [hashtag](https://help.blotato.com/api/visuals/7b7104f1-d277-4993-ad3a-e5883c4b776d\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousSingle Centered Text Quotechevron-left](https://help.blotato.com/api/visuals/9f4e66cd-b784-4c02-b2ce-e6d0765fd4c0) [NextTop Secret Infographicchevron-right](https://help.blotato.com/api/visuals/b8707b58-a106-44af-bb12-e30507e561af)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Top Secret Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/b8707b58-a106-44af-bb12-e30507e561af

Generate a classified government document style infographic image using AI image generation, styled as a top secret briefing laid on a desk.

## [hashtag](https://help.blotato.com/api/visuals/b8707b58-a106-44af-bb12-e30507e561af\#template-information)    Template Information

Property

Value

Template ID

`/video-template/b8707b58-a106-44af-bb12-e30507e561af`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/b8707b58-a106-44af-bb12-e30507e561af\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Declassification notice text. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/b8707b58-a106-44af-bb12-e30507e561af\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/b8707b58-a106-44af-bb12-e30507e561af",
  "inputs": {},
  "prompt": "Create a classified briefing about the secrets of successful entrepreneurs",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/b8707b58-a106-44af-bb12-e30507e561af\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/b8707b58-a106-44af-bb12-e30507e561af",
  "inputs": {
    "description": "PROJECT ALPHA: Classified intelligence reveals the 5 hidden habits of high performers. Eyes only. Need to know basis.",
    "footerText": "Authorized for public release"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/b8707b58-a106-44af-bb12-e30507e561af\#related-templates)    Related Templates

- [Steampunk Infographic](https://help.blotato.com/api/visuals/7b7104f1-d277-4993-ad3a-e5883c4b776d)

- [Futuristic Flyer](https://help.blotato.com/api/visuals/8fa8545e-8955-4a89-a868-cf45023d6cc5)

- [Newspaper Infographic](https://help.blotato.com/api/visuals/07a5b5c5-387c-49e3-86b1-de822cd2dfc7)


## [hashtag](https://help.blotato.com/api/visuals/b8707b58-a106-44af-bb12-e30507e561af\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousSteampunk Infographicchevron-left](https://help.blotato.com/api/visuals/7b7104f1-d277-4993-ad3a-e5883c4b776d) [NextEgyptian Hieroglyph Infographicchevron-right](https://help.blotato.com/api/visuals/a7b0d128-8478-4b34-9647-a0778b6517d0)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Egyptian Hieroglyph Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/a7b0d128-8478-4b34-9647-a0778b6517d0

Generate an ancient Egyptian hieroglyph-style infographic image with carved and painted visuals on sandstone, featuring pharaohs, gods, and hieroglyphic symbols.

## [hashtag](https://help.blotato.com/api/visuals/a7b0d128-8478-4b34-9647-a0778b6517d0\#template-information)    Template Information

Property

Value

Template ID

`/video-template/a7b0d128-8478-4b34-9647-a0778b6517d0`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/a7b0d128-8478-4b34-9647-a0778b6517d0\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text carved at the base. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/a7b0d128-8478-4b34-9647-a0778b6517d0\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/a7b0d128-8478-4b34-9647-a0778b6517d0",
  "inputs": {},
  "prompt": "Create an Egyptian temple wall about the secrets of ancient wisdom",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/a7b0d128-8478-4b34-9647-a0778b6517d0\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/a7b0d128-8478-4b34-9647-a0778b6517d0",
  "inputs": {
    "description": "The Wisdom of the Pharaohs: Balance in all things, patience like the Nile, and vision like the Eye of Horus",
    "footerText": "Blessed by Ra | Share this wisdom"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/a7b0d128-8478-4b34-9647-a0778b6517d0\#related-templates)    Related Templates

- [Cave Painting Infographic](https://help.blotato.com/api/visuals/82ee75b6-597b-43a8-86bc-e4395e7c9c44)

- [Steampunk Infographic](https://help.blotato.com/api/visuals/7b7104f1-d277-4993-ad3a-e5883c4b776d)

- [Book Page Infographic](https://help.blotato.com/api/visuals/b88c8273-6406-48c6-85e7-096119aefe30)


## [hashtag](https://help.blotato.com/api/visuals/a7b0d128-8478-4b34-9647-a0778b6517d0\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousTop Secret Infographicchevron-left](https://help.blotato.com/api/visuals/b8707b58-a106-44af-bb12-e30507e561af) [NextCave Painting Infographicchevron-right](https://help.blotato.com/api/visuals/82ee75b6-597b-43a8-86bc-e4395e7c9c44)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Cave Painting Infographic | Blotato Help
URL: https://help.blotato.com/api/visuals/82ee75b6-597b-43a8-86bc-e4395e7c9c44

Generate a cave painting style infographic image that looks like ancient art on rough stone walls, using earthy pigment colors and primitive hand-drawn elements.

## [hashtag](https://help.blotato.com/api/visuals/82ee75b6-597b-43a8-86bc-e4395e7c9c44\#template-information)    Template Information

Property

Value

Template ID

`/video-template/82ee75b6-597b-43a8-86bc-e4395e7c9c44`

Output Type

Image

Category

AI-Generated Infographics

## [hashtag](https://help.blotato.com/api/visuals/82ee75b6-597b-43a8-86bc-e4395e7c9c44\#parameters)    Parameters

Parameter

Type

Required

Default

Description

description

string

Yes

10 Tips for Effective Time Management

Infographic topic and content. Length: 10-500 characters

footerText

string

Yes

Follow me for more helpful content

Call to action text painted at the bottom. Length: 2-100 characters

## [hashtag](https://help.blotato.com/api/visuals/82ee75b6-597b-43a8-86bc-e4395e7c9c44\#example-1-ai-powered-with-prompt)    Example 1: AI-Powered with Prompt

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/82ee75b6-597b-43a8-86bc-e4395e7c9c44",
  "inputs": {},
  "prompt": "Create a prehistoric cave painting about the fundamentals of teamwork",
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/82ee75b6-597b-43a8-86bc-e4395e7c9c44\#example-2-manual-inputs)    Example 2: Manual Inputs

Copy

```
POST https://backend.blotato.com/v2/videos/from-templates
Content-Type: application/json
blotato-api-key: YOUR_API_KEY

{
  "templateId": "/video-template/82ee75b6-597b-43a8-86bc-e4395e7c9c44",
  "inputs": {
    "description": "Ancient Wisdom: Work together like the hunt, share like the tribe, and celebrate like the fire circle",
    "footerText": "Pass this knowledge to your clan"
  },
  "render": true
}
```

## [hashtag](https://help.blotato.com/api/visuals/82ee75b6-597b-43a8-86bc-e4395e7c9c44\#related-templates)    Related Templates

- [Egyptian Hieroglyph Infographic](https://help.blotato.com/api/visuals/a7b0d128-8478-4b34-9647-a0778b6517d0)

- [Trail Marker Infographic](https://help.blotato.com/api/visuals/29ebb2bd-02b7-4317-8bb8-c30eb938e47c)

- [Chalkboard Infographic](https://help.blotato.com/api/visuals/fcd64907-b103-46f8-9f75-51b9d1a522f5)


## [hashtag](https://help.blotato.com/api/visuals/82ee75b6-597b-43a8-86bc-e4395e7c9c44\#see-also)    See Also

- [Create Visual API Reference](https://help.blotato.com/api/create-video)

- [All Visual Templates](https://help.blotato.com/api/visuals)


[PreviousEgyptian Hieroglyph Infographicchevron-left](https://help.blotato.com/api/visuals/a7b0d128-8478-4b34-9647-a0778b6517d0) [NextSourcechevron-right](https://help.blotato.com/api/create-source)

Last updated 29 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Source | Blotato Help
URL: https://help.blotato.com/api/create-source

Submit content for extraction and receive a source ID for polling.

## [hashtag](https://help.blotato.com/api/create-source\#endpoint)    Endpoint

Copy

```
POST https://backend.blotato.com/v2/source-resolutions-v3
```

**Rate Limit:** 30 requests / minute

## [hashtag](https://help.blotato.com/api/create-source\#authentication)    Authentication

Include your Blotato API key in the request headers:

Copy

```
blotato-api-key: YOUR_API_KEY
```

## [hashtag](https://help.blotato.com/api/create-source\#source-types)    Source Types

Value

Requires

Description

`youtube`

`url`

Extract YouTube transcript

`tiktok`

`url`

Extract TikTok transcript

`article`

`url`

Extract article text from a web page

`pdf`

`url`

Extract text from a PDF

`audio`

`url`

Transcribe audio (mp3, wav, m4a, ogg, flac, aac)

`twitter`

`url`

Extract tweet content

`text`

`text`

Transform raw text content with optional AI instructions

`perplexity-query`

`text`

AI-powered web research query

## [hashtag](https://help.blotato.com/api/create-source\#parameters)    Parameters

Parameter

Type

Required

Description

`source.sourceType`

string

Yes

One of: `youtube`, `tiktok`, `article`, `pdf`, `audio`, `twitter`, `text`, `perplexity-query`

`source.url`

string

Required for URL-based types

The URL to extract content from

`source.text`

string

Required for `text` and `perplexity-query`

Raw text or search query

`customInstructions`

string

No

AI instructions to transform extracted content

## [hashtag](https://help.blotato.com/api/create-source\#examples)    Examples

### [hashtag](https://help.blotato.com/api/create-source\#extract-youtube-transcript)    Extract YouTube Transcript

Copy

```
{
  "source": {
    "sourceType": "youtube",
    "url": "https://www.youtube.com/watch?v=VIDEO_ID"
  }
}
```

### [hashtag](https://help.blotato.com/api/create-source\#extract-article-with-custom-instructions)    Extract Article with Custom Instructions

Copy

```
{
  "source": {
    "sourceType": "article",
    "url": "https://example.com/article"
  },
  "customInstructions": "Summarize in 5 bullet points"
}
```

### [hashtag](https://help.blotato.com/api/create-source\#ai-research-query)    AI Research Query

Copy

```
{
  "source": {
    "sourceType": "perplexity-query",
    "text": "latest AI trends in social media marketing"
  }
}
```

### [hashtag](https://help.blotato.com/api/create-source\#transform-raw-text)    Transform Raw Text

Copy

```
{
  "source": {
    "sourceType": "text",
    "text": "Your raw content here..."
  },
  "customInstructions": "Rewrite as a Twitter thread"
}
```

## [hashtag](https://help.blotato.com/api/create-source\#response)    Response

Copy

```
{
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

Use this ID with the [Get Source](https://help.blotato.com/api/create-source/get-source) endpoint to retrieve the extracted content.

## [hashtag](https://help.blotato.com/api/create-source\#n8n-and-make.com)    n8n and Make.com

In the official Blotato nodes:

1. Add a Blotato node

2. Select "Source" > "Create"

3. Choose your source type

4. Pass the output source ID to a "Get Source" node to retrieve content


[PreviousCave Painting Infographicchevron-left](https://help.blotato.com/api/visuals/82ee75b6-597b-43a8-86bc-e4395e7c9c44) [NextGet Sourcechevron-right](https://help.blotato.com/api/create-source/get-source)

Last updated 1 month ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Get Source | Blotato Help
URL: https://help.blotato.com/api/create-source/get-source

Retrieve extracted content by source ID.

## [hashtag](https://help.blotato.com/api/create-source/get-source\#endpoint)    Endpoint

Copy

```
GET https://backend.blotato.com/v2/source-resolutions-v3/:id
```

## [hashtag](https://help.blotato.com/api/create-source/get-source\#authentication)    Authentication

Include your Blotato API key in the request headers:

Copy

```
blotato-api-key: YOUR_API_KEY
```

## [hashtag](https://help.blotato.com/api/create-source/get-source\#parameters)    Parameters

Parameter

Type

Required

Description

`id`

string

Yes

The source resolution ID (UUID) from Create Source

`cleanTranscript`

boolean

No

Remove timestamps from transcripts. Default: true

## [hashtag](https://help.blotato.com/api/create-source/get-source\#clean-transcript-option)    Clean Transcript Option

When `cleanTranscript` is enabled (default), the response removes:

- VTT/SRT timestamp lines

- Sequence numbers

- Markdown formatting

- Extra whitespace


This makes transcripts easier to use for content repurposing.

## [hashtag](https://help.blotato.com/api/create-source/get-source\#response)    Response

### [hashtag](https://help.blotato.com/api/create-source/get-source\#processing-poll-again)    Processing (poll again)

Copy

```
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "processing"
}
```

### [hashtag](https://help.blotato.com/api/create-source/get-source\#completed)    Completed

Copy

```
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "title": "Video Title",
  "content": "Extracted text content...",
  "referenceUrl": "https://original-source-url.com"
}
```

### [hashtag](https://help.blotato.com/api/create-source/get-source\#failed)    Failed

Copy

```
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "failed",
  "message": "Error description"
}
```

## [hashtag](https://help.blotato.com/api/create-source/get-source\#status-values)    Status Values

Status

Description

`queued`

Source submitted, waiting to process

`processing`

Extraction in progress

`completed`

Extraction successful, content available

`failed`

Extraction failed, check message field

## [hashtag](https://help.blotato.com/api/create-source/get-source\#polling-pattern)    Polling Pattern

Source extraction is asynchronous. After calling Create Source:

1. Wait 2-5 seconds

2. Call Get Source with the ID

3. If status is `queued` or `processing`, wait and retry

4. If status is `completed`, use the `content` field

5. If status is `failed`, check the `message` field


## [hashtag](https://help.blotato.com/api/create-source/get-source\#n8n-and-make.com)    n8n and Make.com

In the official Blotato nodes:

1. Add a Blotato node

2. Select "Source" > "Get"

3. Pass in the source ID from "Create Source"

4. Add a Wait node (5-10 seconds) between Create and Get for longer content

5. The extracted content appears in the response


[PreviousSourcechevron-left](https://help.blotato.com/api/create-source) [NextAutomation Templateschevron-right](https://help.blotato.com/api/templates)

Last updated 1 month ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# 11 Build Your First AI Automation | Blotato Help
URL: https://help.blotato.com/api/templates/11-build-your-first-ai-automation

This beginner-friendly template shows you how to extract content from any source (YouTube, TikTok, articles, PDFs) and publish it to social media.

## [hashtag](https://help.blotato.com/api/templates/11-build-your-first-ai-automation\#what-youll-learn)    What You'll Learn

- How to use the Create Source node to extract content

- How to use the Get Source node to retrieve extracted content

- How to transform content with custom instructions

- How to create visuals and publish to multiple platforms


## [hashtag](https://help.blotato.com/api/templates/11-build-your-first-ai-automation\#video-tutorial)    Video Tutorial

[https://youtu.be/YOUR\_VIDEO\_IDyoutu.bechevron-right](https://youtu.be/YOUR_VIDEO_ID)

## [hashtag](https://help.blotato.com/api/templates/11-build-your-first-ai-automation\#prerequisites)    Prerequisites

1. Blotato API key ( [get one herearrow-up-right](https://my.blotato.com/settings))

2. n8n or Make.com account

3. Social accounts connected in Blotato


## [hashtag](https://help.blotato.com/api/templates/11-build-your-first-ai-automation\#workflow-overview)    Workflow Overview

This automation:

1. Takes a YouTube URL as input

2. Extracts the transcript using Create Source

3. Waits for processing

4. Retrieves the content using Get Source

5. Creates visuals (videos, carousels) with Blotato

6. Publishes to your connected platforms


## [hashtag](https://help.blotato.com/api/templates/11-build-your-first-ai-automation\#step-by-step-setup)    Step-by-Step Setup

### [hashtag](https://help.blotato.com/api/templates/11-build-your-first-ai-automation\#step-1-add-create-source-node)    Step 1: Add Create Source Node

1. Add a Blotato node to your workflow

2. Select "Source" > "Create"

3. Set Source Type to "URL"

4. Enter your YouTube URL


### [hashtag](https://help.blotato.com/api/templates/11-build-your-first-ai-automation\#step-2-add-wait-node)    Step 2: Add Wait Node

1. Add a Wait node after Create Source

2. Set wait time to 10 seconds (adjust for longer videos)


### [hashtag](https://help.blotato.com/api/templates/11-build-your-first-ai-automation\#step-3-add-get-source-node)    Step 3: Add Get Source Node

1. Add another Blotato node

2. Select "Source" > "Get"

3. Pass the source ID from Step 1

4. Enable "Clean Transcript" to remove timestamps


### [hashtag](https://help.blotato.com/api/templates/11-build-your-first-ai-automation\#step-4-add-create-visual-node)    Step 4: Add Create Visual Node

1. Add a Blotato node

2. Select "Visual" > "Create"

3. Choose a template (carousel, slideshow, or video)

4. Pass the extracted content as the script or text input


### [hashtag](https://help.blotato.com/api/templates/11-build-your-first-ai-automation\#step-5-add-publish-node)    Step 5: Add Publish Node

1. Add a Blotato node

2. Select "Post" > "Publish"

3. Select your target platform

4. Pass the visual URL from Step 4


## [hashtag](https://help.blotato.com/api/templates/11-build-your-first-ai-automation\#tips)    Tips

- Start with short YouTube videos (under 5 minutes) for faster testing

- Use custom instructions in Create Source to pre-process content

- Increase wait time for longer videos or PDFs

- Check your [API Dashboardarrow-up-right](https://my.blotato.com/api-dashboard) if extraction fails


## [hashtag](https://help.blotato.com/api/templates/11-build-your-first-ai-automation\#source-types-you-can-use)    Source Types You Can Use

Source Type

Examples

YouTube

Video transcripts

TikTok

Video transcripts

Articles

Blog posts, news articles

PDFs

Ebooks, research papers

Audio

Podcasts, meeting recordings

Text

Raw text you paste in

AI Research

Perplexity-powered web search

## [hashtag](https://help.blotato.com/api/templates/11-build-your-first-ai-automation\#next-steps)    Next Steps

Once you're comfortable with this basic flow:

- Explore the [1 Post Everywhere](https://help.blotato.com/api/templates/1-post-everywhere) template for multi-platform posting

- Try [AI Clone Videos](https://help.blotato.com/api/templates/3-hackernews-to-ai-clone-videos) for automated avatar videos

- Check [Faceless Videos](https://help.blotato.com/api/n8n/n8n-faceless-videos) for AI-generated video content


[PreviousAutomation Templateschevron-left](https://help.blotato.com/api/templates) [Next1 Post Everywherechevron-right](https://help.blotato.com/api/templates/1-post-everywhere)

Last updated 1 month ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# 1 Post Everywhere | Blotato Help
URL: https://help.blotato.com/api/templates/1-post-everywhere

![Page cover](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252F0CX85EJZtyWv113CAbZE%252FScreenshot%25202025-08-25%2520at%252012.00.54%25E2%2580%25AFPM.png%3Falt%3Dmedia%26token%3D5169a259-75ec-4656-8c95-f6d7aac0c782&width=1248&dpr=3&quality=100&sign=a9509d0b&sv=2)

### [hashtag](https://help.blotato.com/api/templates/1-post-everywhere\#description)    Description

This automation publishes to 9 social platforms daily! Manage your content in a simple Google Sheet. When you set a post's status to "Ready to Post" in your Google Sheet, this workflow grabs your image/video from Google Drive, posts to 9 social platforms, then updates the post status to "Posted".

### [hashtag](https://help.blotato.com/api/templates/1-post-everywhere\#platforms)    Platforms

n8n

Make

Zapier

check

check

### [hashtag](https://help.blotato.com/api/templates/1-post-everywhere\#templates)    Templates

[https://drive.google.com/drive/folders/1YphrE-bclOAxsq33cVQ1Ku-NmhQ0dJxv?usp=drive\_linkarrow-up-right](https://drive.google.com/drive/folders/1YphrE-bclOAxsq33cVQ1Ku-NmhQ0dJxv?usp=drive_link)

### [hashtag](https://help.blotato.com/api/templates/1-post-everywhere\#tutorials)    Tutorials

Easy social media system in n8n & Make - YouTube

Tap to unmute

[Easy social media system in n8n & Make](https://www.youtube.com/watch?v=AB_5ifmBqec) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=AB_5ifmBqec)

### [hashtag](https://help.blotato.com/api/templates/1-post-everywhere\#overview)    Overview

Here’s how the automation works:

**1\. Trigger: Check Every 3 Hours**

- Check Google Sheet for posts with Status "Ready to Post"

- Return 1 post that is ready to go


**2\. Publish to Social Media via Blotato**

- Pass your image/video URL directly to the Publish node - no upload step required


Note: The original YouTube tutorial shows an UPLOAD node, but this step is no longer required. Pass your image/video URLs directly into the `mediaUrls` parameter in the Publish node.

**3\. Connect Your Social Accounts**

- Connect your Blotato account

- Choose your social accounts

- Either post immediately or schedule for later

- Includes support for images, videos, slideshows, carousels, and threads


### [hashtag](https://help.blotato.com/api/templates/1-post-everywhere\#setup)    Setup

- Sign up for Blotato.com

- Generate Blotato API Key by going to Settings > API > Generate API Key (paid feature only)

- [Install the Blotato community nodearrow-up-right](https://help.blotato.com/api/n8n/n8n-blotato-node)

- Create credential for Blotato.

- Connect your Google Drive to n8n: [https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-servicearrow-up-right](https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service)

- Copy this sample Google Sheet. Do NOT change the column names, unless you know what you're doing: [https://docs.google.com/spreadsheets/d/1v5S7F9p2apfWRSEHvx8Q6ZX8e-d1lZ4FLlDFyc0-ZA4/editarrow-up-right](https://docs.google.com/spreadsheets/d/1v5S7F9p2apfWRSEHvx8Q6ZX8e-d1lZ4FLlDFyc0-ZA4/edit)

- Make your Google Drive folder containing images/videos PUBLIC (i.e. Anyone with the link)

- Complete the 3 setup steps shown in BROWN sticky notes in this template


The templates run every 3 hours, which you can customize. It checks Google Sheets for rows where Status is “Ready to Post”, and return only the first matching row. This avoids spamming too many posts at the same time.

### [hashtag](https://help.blotato.com/api/templates/1-post-everywhere\#general-troubleshooting-checklist)    General Troubleshooting Checklist

- your Google Drive is public

- column names in your Google Sheet match the original example

- file size < 60MB; for large files, Google Drive does not work, use Amazon S3 instead


### [hashtag](https://help.blotato.com/api/templates/1-post-everywhere\#tips-and-tricks)    Tips & Tricks

You can pair this workflow with another automation that populates your Google Sheet and drops media into your Google Drive folder, so that you have a human-in-the-loop quality review check allowing you to edit content before posting. This is the approach I always advise, especially for beginner creators, as you want to ensure you’re sharing high-quality content.

Prepare a batch of rows with Status set to “In Progress” which means you’re still working on the content. Switch 1 row to “Ready to Post” when the ready to test posting.

The workflow processes 1 row per run, then checks again on the next schedule. Scale by adjusting the schedule interval. Shorter intervals increase throughput. Longer intervals spread posts out.

For issues, review the [Blotato API dashboardarrow-up-right](https://my.blotato.com/api-dashboard) request log and payload because it contains all error messages.

Other helpful links:

**👉** [**Blotato API Docs** arrow-up-right](https://help.blotato.com/api)

✅ [**Troubleshoot Errors** arrow-up-right](https://my.blotato.com/api-dashboard)

📷 [**Media Requirements** arrow-up-right](https://help.blotato.com/api/media)

### [hashtag](https://help.blotato.com/api/templates/1-post-everywhere\#n8n-notes)    n8n Notes

1. [Install the Blotato community nodearrow-up-right](https://help.blotato.com/api/n8n/n8n-blotato-node)

2. If a template shows question marks instead of the Blotato logo, install the Blotato node first, then re-import the template.

3. Create a new Credential in n8n. Go to Blotato Settings > API > Copy API Key. Paste the API key in n8n, save, test, then select this credential on Blotato nodes.

4. Connect social accounts on each platform node. Open each Blotato Publish node, select the Blotato credential, then pick Tiktok, Linkedin, Facebook Page, Instagram, X, Youtube, Threads, Bluesky, or Pinterest. For Pinterest, add the Board ID. In Blotato, create a sample Pinterest post, click Publish, choose a board, and copy the Board ID from the dropdown.

5. When testing, deactivate all social platform nodes. Activate just 1 to start with. Run the workflow, then Pin data at the Blotato Publish node. This locks inputs for repeat tests. Then, execute 1 platform node from pinned data to validate it works. Activate other social platforms to continue testing.

6. Use the [Blotato API dashboardarrow-up-right](https://my.blotato.com/api-dashboard) to review each request, payload, and error message.


### [hashtag](https://help.blotato.com/api/templates/1-post-everywhere\#make-notes)    Make Notes

1. Open the scenario and set the schedule at the bottom bar to run every 3 hours, or 180 minutes, as a safe starting point.

2. Connect to your Google Sheet and query rows where Status is “Ready to Post”. Limit to 1 row returned to avoid spamming.

3. Create a Blotato connection, choose each platform, then select your target social media account. Advanced parameters exist for slideshows, music, and other options, though your 1st run needs no changes. For Pinterest, remember to add your Board ID.

4. When testing, make sure to “Disable Route” to all social platform modules. Enable just 1 route to start with. If it’s successful, then activate other social platforms one at a time to continue testing.


### [hashtag](https://help.blotato.com/api/templates/1-post-everywhere\#zapier-notes)    Zapier Notes

n/a

[Previous11 Build Your First AI Automationchevron-left](https://help.blotato.com/api/templates/11-build-your-first-ai-automation) [Next2 Email to Long Form Threadchevron-right](https://help.blotato.com/api/templates/2-email-to-long-form-thread)

Last updated 3 months ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# 2 Email to Long Form Thread | Blotato Help
URL: https://help.blotato.com/api/templates/2-email-to-long-form-thread

![Page cover](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252Fb4CgeMcRjRJrBAHeAxYY%252FScreenshot%25202025-09-05%2520at%252010.28.37%25E2%2580%25AFAM.png%3Falt%3Dmedia%26token%3D7561cfa1-76bc-462b-942e-fe35a6676ce9&width=1248&dpr=3&quality=100&sign=43ebfcf1&sv=2)

### [hashtag](https://help.blotato.com/api/templates/2-email-to-long-form-thread\#description)    Description

Send an email to yourself with a rough idea you want to post about, then ChatGPT will clean it up, apply a viral thread template, and Blotato will post it on your socials as a long-form thread.

### [hashtag](https://help.blotato.com/api/templates/2-email-to-long-form-thread\#platforms)    Platforms

n8n

Make

Zapier

check

check

### [hashtag](https://help.blotato.com/api/templates/2-email-to-long-form-thread\#templates)    Templates

[https://drive.google.com/drive/folders/1nySPtURxLWYiWYrP2Uwpnq0tEyLqQgOC?usp=sharingarrow-up-right](https://drive.google.com/drive/folders/1nySPtURxLWYiWYrP2Uwpnq0tEyLqQgOC?usp=sharing)

### [hashtag](https://help.blotato.com/api/templates/2-email-to-long-form-thread\#tutorials)    Tutorials

AI Agent Writes Twitter Threads On Autopilot! (n8n & Make) - YouTube

Tap to unmute

[AI Agent Writes Twitter Threads On Autopilot! (n8n & Make)](https://www.youtube.com/watch?v=QnseBiphF7E) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=QnseBiphF7E)

### [hashtag](https://help.blotato.com/api/templates/2-email-to-long-form-thread\#overview)    Overview

Here’s how the automation works:

**1\. Trigger: Gmail**

- Connect your Gmail account

- This node will monitor emails sent from you and filter emails with subject containing the word “thread”


**2\. ChatGPT Writes Threads**

- Connect your OpenAI account

- This node prompts ChatGPT to write a long-form thread


**3\. Publish to Social Media via Blotato**

- Connect your Blotato account

- Choose your social accounts (Twitter, Threads, Bluesky)

- Either schedule the thread later or post immediately

- Includes support for optional image/video URLs


### [hashtag](https://help.blotato.com/api/templates/2-email-to-long-form-thread\#prerequisites)    Prerequisites

1. Sign up for [Blotato.comarrow-up-right](https://www.blotato.com/)

2. Generate Blotato API Key by going to Settings > API > Generate API Key (paid feature only)

3. If you're using n8n, [install the Blotato community nodearrow-up-right](https://help.blotato.com/api/n8n/n8n-blotato-node)

4. Make sure you have a Gmail account

5. Make sure you have an [OpenAI Platformarrow-up-right](https://platform.openai.com/docs/overview) account to access ChatGPT.

6. Think of a topic you want to write about it and send an email yourself, making sure you use Gmail. It doesn’t need to be neatly formatted. I personally use Superwhispr to talk through my ideas, then AI cleans up the transcript automatically. Many folks find “talking” to be the fastest form of content creation vs. writing, so try it out!



1. Make sure your subject line contains the word: **“thread”**

2. Here’s an example…


Subject: **thread**

Body:

> I'm obsessed with voice AI apps. Super Whisper is my current favorite because it runs locally and keeps my voice data private. I talk to it instead of typing. Way faster.

### [hashtag](https://help.blotato.com/api/templates/2-email-to-long-form-thread\#tips-and-tricks)    Tips & Tricks

I opted to use a Gmail trigger for this tutorial because it’s free, easy to setup, and ubiquitous. No fiddling around with bots, secrets, etc. But many of you will want to swap out Gmail for Whatsapp, Slack, or Telegram. There’s no issue doing so; everything still works the same.

During testing, use “Scheduled Time” when posting via Blotato instead of immediate posting. That way you can preview before going live and spamming test posts.

You can attach images or videos to individual tweets in the thread. The \`mediaUrls\` array takes a string of publicly accessible image/video URLs. This is more advanced, so I’ll showcase this in a future template. But if you know what you’re doing, insert your image/video URLs in to the \`mediaUrls\` array.

To tweak the writing style further, provide examples of your favorite viral threads to help ChatGPT emulate structure and tone. There’s already a long prompt that shows 1 example viral thread; simply replace it with your preferred thread.

If you need help troubleshooting your automation:

- the [API Dashboardarrow-up-right](https://my.blotato.com/api-dashboard) is your best friend

- go to my.blotato.com and click the ORANGE BUTTON in the bottom right corner to send me a support message


Other helpful links:

**👉** [**Blotato API Docs** arrow-up-right](https://help.blotato.com/api)

✅ [**Troubleshoot Errors** arrow-up-right](https://my.blotato.com/api-dashboard)

📷 [**Media Requirements** arrow-up-right](https://help.blotato.com/api/media)

### [hashtag](https://help.blotato.com/api/templates/2-email-to-long-form-thread\#n8n-notes)    n8n Notes

1. [Install the Blotato community nodearrow-up-right](https://help.blotato.com/api/n8n/n8n-blotato-node)

2. If a template shows question marks instead of the Blotato logo, install the Blotato node first, then re-import the template.

3. Create a new Credential in n8n. Go to Blotato Settings > API > Copy API Key. Paste the API key in n8n, save, test, then select this credential on Blotato nodes.

4. Connect social accounts on each platform node. Open each Blotato Publish node, select the Blotato credential, then pick your social account.

5. When testing, deactivate all social platform nodes. Activate just 1 to start with. Run the workflow, then Pin data at the Blotato Publish node. This locks inputs for repeat tests. Then, execute 1 platform node from pinned data to validate it works. Activate other social platforms to continue testing.

6. Use the [Blotato API dashboardarrow-up-right](https://my.blotato.com/api-dashboard) to review each request, payload, and error message.


### [hashtag](https://help.blotato.com/api/templates/2-email-to-long-form-thread\#make-notes)    Make Notes

1. Create a Blotato connection, choose each platform, then select your target social media account.

2. When testing, make sure to “Disable Route” to all social platform modules. Enable just 1 route to start with. If it’s successful, then activate other social platforms one at a time to continue testing.


### [hashtag](https://help.blotato.com/api/templates/2-email-to-long-form-thread\#zapier-notes)    Zapier Notes

n/a

[Previous1 Post Everywherechevron-left](https://help.blotato.com/api/templates/1-post-everywhere) [Next3 Hackernews to AI Clone Videoschevron-right](https://help.blotato.com/api/templates/3-hackernews-to-ai-clone-videos)

Last updated 3 months ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# 3 Hackernews to AI Clone Videos | Blotato Help
URL: https://help.blotato.com/api/templates/3-hackernews-to-ai-clone-videos

![Page cover](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252FPtkDAncwAI9uU0LdlVh4%252FScreenshot%25202025-09-05%2520at%252010.30.23%25E2%2580%25AFAM.png%3Falt%3Dmedia%26token%3D5b94ea9e-5fe8-4fd2-abef-36e978315e83&width=1248&dpr=3&quality=100&sign=19d60e21&sv=2)

### [hashtag](https://help.blotato.com/api/templates/3-hackernews-to-ai-clone-videos\#description)    Description

This fully automated AI Avatar Social Media system that creates talking head AI clone videos, WITHOUT having to film or edit yourself. It combines n8n, AI agent, HeyGen, and Blotato to research, create, and distribute talking head AI clone videos to every social media platform every single day.

### [hashtag](https://help.blotato.com/api/templates/3-hackernews-to-ai-clone-videos\#platforms)    Platforms

n8n

Make

Zapier

check

### [hashtag](https://help.blotato.com/api/templates/3-hackernews-to-ai-clone-videos\#templates)    Templates

[https://drive.google.com/drive/folders/1yReo1qKOFWzeTxf9c3NQMmZZ7Hw1TUc7?usp=sharingarrow-up-right](https://drive.google.com/drive/folders/1yReo1qKOFWzeTxf9c3NQMmZZ7Hw1TUc7?usp=sharing)

### [hashtag](https://help.blotato.com/api/templates/3-hackernews-to-ai-clone-videos\#tutorials)    Tutorials

This Workflow Auto Posts in 7 Different Socials (Free Template) - YouTube

Tap to unmute

[This Workflow Auto Posts in 7 Different Socials (Free Template)](https://www.youtube.com/watch?v=8sPYxqU1SoQ) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=8sPYxqU1SoQ)

### [hashtag](https://help.blotato.com/api/templates/3-hackernews-to-ai-clone-videos\#overview)    Overview

Here’s how the automation works:

1. **Trigger: Schedule**


- Configured to run once daily at 10am


1. **AI News Research**


- Research viral news from tech-focused forum, Hackernews

- Fetch the selected news item, plus discussion comments


1. **AI Writer**


- AI writes 30-second monologue script

- AI writes short video caption


1. **Create Avatar Video**


- Call Heygen API (requires paid API plan), specifying your avatar ID and voice ID

- Create avatar video, optionally passing in an image/video background if you have a green screen avatar (matte: true)


1. **Get Video**


- Wait awhile, then fetch completed avatar video


1. **Publish to Social Media via Blotato**


- Pass the video URL directly to the Blotato Publish node - no upload step required

- Connect your Blotato account

- Choose your social accounts

- Either post immediately or schedule for later


### [hashtag](https://help.blotato.com/api/templates/3-hackernews-to-ai-clone-videos\#prerequisites)    Prerequisites

1. Sign up for [Blotato.comarrow-up-right](https://www.blotato.com/)

2. Generate Blotato API Key by going to Settings > API > Generate API Key (paid feature only)

3. If you're using n8n, [install the Blotato community nodearrow-up-right](https://help.blotato.com/api/n8n/n8n-blotato-node)

4. Sign up for Heygen


- Paste your Heygen API key

- Paste your Heygen avatar ID

- Paste your Heygen voice ID

- If you want to pass in an optional background video as a green screen effect, use the 2nd agnt `background_video_url` that is already filled out (change it later, after ensuring everything works)


### [hashtag](https://help.blotato.com/api/templates/3-hackernews-to-ai-clone-videos\#tips-and-tricks)    Tips & Tricks

While testing: enable only 1 social platform, and deactivate the rest for testing purposes. Update the AI agent node’s prompt to return a 5-second script, rather than 30 seconds, to reduce the processing duration.

Go to Heygen and check that your avatar video is being processed.

After the workflow finishes, check your social media account for the final post.

If successful, then enable another social media node, and continue testing.

If you need help troubleshooting your automation:

- the [API Dashboardarrow-up-right](https://my.blotato.com/api-dashboard) is your best friend

- go to my.blotato.com and click the ORANGE BUTTON in the bottom right corner to send me a support message


Other helpful links:

**👉** [**Blotato API Docs** arrow-up-right](https://help.blotato.com/api)

✅ [**Troubleshoot Errors** arrow-up-right](https://my.blotato.com/api-dashboard)

📷 [**Media Requirements** arrow-up-right](https://help.blotato.com/api/media)

### [hashtag](https://help.blotato.com/api/templates/3-hackernews-to-ai-clone-videos\#n8n-notes)    n8n Notes

1. [Install the Blotato community nodearrow-up-right](https://help.blotato.com/api/n8n/n8n-blotato-node)

2. If a template shows question marks instead of the Blotato logo, install the Blotato node first, then re-import the template.

3. Create a new Credential in n8n. Go to Blotato Settings > API > Copy API Key. Paste the API key in n8n, save, test, then select this credential on Blotato nodes.

4. Connect social accounts on each platform node. Open each Blotato Publish node, select the Blotato credential, then pick your social account.

5. When testing, deactivate all social platform nodes. Activate just 1 to start with. Run the workflow, then Pin data at the Blotato Publish node. This locks inputs for repeat tests. Then, execute 1 platform node from pinned data to validate it works. Activate other social platforms to continue testing.

6. Use the [Blotato API dashboardarrow-up-right](https://my.blotato.com/api-dashboard) to review each request, payload, and error message.


### [hashtag](https://help.blotato.com/api/templates/3-hackernews-to-ai-clone-videos\#make-notes)    Make Notes

1. Create a Blotato connection, choose each platform, then select your target social media account.

2. When testing, make sure to “Disable Route” to all social platform modules. Enable just 1 route to start with. If it’s successful, then activate other social platforms one at a time to continue testing.


### [hashtag](https://help.blotato.com/api/templates/3-hackernews-to-ai-clone-videos\#zapier-notes)    Zapier Notes

n/a

### [hashtag](https://help.blotato.com/api/templates/3-hackernews-to-ai-clone-videos\#faqs)    FAQs

#### [hashtag](https://help.blotato.com/api/templates/3-hackernews-to-ai-clone-videos\#how-do-i-get-captions-on-my-heygen-avatar-video)    How do I get captions on my Heygen avatar video?

You'll need to change 2 steps:

1. In the CREATE HEYGEN VIDEO step, there is a setting to enable captions. Make sure it's turned on.

2. In the Blotato Publish step, pass the `video_url_caption` from the GET VIDEO step into the mediaUrls parameter. This will use the video version with captions.


Remember to test your workflow after making this change to make sure everything works as expected.

#### [hashtag](https://help.blotato.com/api/templates/3-hackernews-to-ai-clone-videos\#how-do-i-make-my-heygen-avatar-videos-look-more-stylized)    How do I make my HeyGen avatar videos look more stylized?

Use Blotato's CREATE VISUAL node to enhance your HeyGen videos:

1. **Combine Existing Clips template**: Adds a stylized title and captions to your video

2. **Avatar video with b-roll template**: Generates relevant b-roll images based on your script


In n8n or Make, add a Blotato node after you receive your HeyGen video, select "Visual" > "Create", then choose one of these templates.

[Previous2 Email to Long Form Threadchevron-left](https://help.blotato.com/api/templates/2-email-to-long-form-thread) [Next4 Viral News to AI Avatar Videoschevron-right](https://help.blotato.com/api/templates/4-viral-news-to-ai-avatar-videos)

Last updated 1 month ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# 4 Viral News to AI Avatar Videos | Blotato Help
URL: https://help.blotato.com/api/templates/4-viral-news-to-ai-avatar-videos

![Page cover](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252FPtkDAncwAI9uU0LdlVh4%252FScreenshot%25202025-09-05%2520at%252010.30.23%25E2%2580%25AFAM.png%3Falt%3Dmedia%26token%3D5b94ea9e-5fe8-4fd2-abef-36e978315e83&width=1248&dpr=3&quality=100&sign=19d60e21&sv=2)

### [hashtag](https://help.blotato.com/api/templates/4-viral-news-to-ai-avatar-videos\#description)    Description

This fully automated AI Avatar Viral News system researches the latest trending news in your niche or industry, then generates talking head AI clone videos, WITHOUT having to film or edit yourself. It combines ChatGPT, Perplexity, HeyGen, and Blotato to research, create, and auto-post talking head AI avatar videos to every social media platform, every single day.

### [hashtag](https://help.blotato.com/api/templates/4-viral-news-to-ai-avatar-videos\#platforms)    Platforms

n8n

Make

Zapier

check

### [hashtag](https://help.blotato.com/api/templates/4-viral-news-to-ai-avatar-videos\#templates)    Templates

[https://drive.google.com/drive/folders/14iKWgwKOJIhc9hjgrUWn9zqKWQnUrMsn?usp=sharingarrow-up-right](https://drive.google.com/drive/folders/14iKWgwKOJIhc9hjgrUWn9zqKWQnUrMsn?usp=sharing)

### [hashtag](https://help.blotato.com/api/templates/4-viral-news-to-ai-avatar-videos\#tutorials)    Tutorials

n8n AI Avatar System for Tiktok, Reels, and Shorts - YouTube

Tap to unmute

[n8n AI Avatar System for Tiktok, Reels, and Shorts](https://www.youtube.com/watch?v=0T3FjaxDISI) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=0T3FjaxDISI)

### [hashtag](https://help.blotato.com/api/templates/4-viral-news-to-ai-avatar-videos\#overview)    Overview

Here’s how the automation works:

**1\. Trigger: Schedule**

- Configured to run once daily at 10am


**2\. AI Researcher**

- Call Perplexity to research the top 10 latest news in your industry

- Select news story most likely to go viral

- Compile detailed factual report on selected news story


**3\. AI Writer**

- AI writes monologue script, video caption, and short title


**4\. Create Avatar Video**

- Call Heygen API (requires paid API plan), specifying your avatar ID and voice ID

- Create avatar video, optionally passing in an image/video background if you have a green screen avatar


**5\. Get Video**

- Wait awhile, then fetch completed avatar video


**6\. Publish to Social Media via Blotato**

- Pass the video URL directly to the Blotato Publish node - no upload step required

- Connect your Blotato account

- Choose your social accounts

- Either post immediately or schedule for later


### [hashtag](https://help.blotato.com/api/templates/4-viral-news-to-ai-avatar-videos\#prerequisites)    Prerequisites

1. Sign up for Perplexity:


- Setup your API Billing.

- Generate your API Key: [https://www.perplexity.ai/account/api/keysarrow-up-right](https://www.perplexity.ai/account/api/keys)


1. Sign up for Heygen:


- Create your avatar.

- Paste your Heygen API key.

- Paste your Heygen avatar ID.

- Paste your Heygen voice ID.

- If you want a background image/video behind your avatar: (1) ensure you have an avatar with background removed which requires a higher tier plan; (2) open SETUP HEYGEN node and set parameter 'has\_background\_video' to \`true\`; (3) open SETUP HEYGEN node and replace video URL in parameter 'background\_video\_url'. I only recommend doing this AFTER the full workflow is operational.


1. Sign up for [Blotato.comarrow-up-right](https://www.blotato.com/)


- Generate Blotato API Key by going to Settings > API > Generate API Key (paid feature only).

- If you're using n8n, [install the Blotato community nodearrow-up-right](https://help.blotato.com/api/n8n/n8n-blotato-node)


### [hashtag](https://help.blotato.com/api/templates/4-viral-news-to-ai-avatar-videos\#tips-and-tricks)    Tips & Tricks

While testing: enable only 1 social platform, and deactivate the rest for testing purposes. Update the AI writer prompt to return a 5-second script, rather than 30 seconds, to reduce the processing duration.

Go to Heygen and check that your avatar video is being processed.

After the workflow finishes, check your social media account for the final post.

If successful, then enable another social media node, and continue testing.

If you need help troubleshooting your automation:

- the [API Dashboardarrow-up-right](https://my.blotato.com/api-dashboard) is your best friend

- go to my.blotato.com and click the ORANGE BUTTON in the bottom right corner to send me a support message


Other helpful links:

**👉** [**Blotato API Docs** arrow-up-right](https://help.blotato.com/api)

✅ [**Troubleshoot Errors** arrow-up-right](https://my.blotato.com/api-dashboard)

📷 [**Media Requirements** arrow-up-right](https://help.blotato.com/api/media)

### [hashtag](https://help.blotato.com/api/templates/4-viral-news-to-ai-avatar-videos\#n8n-notes)    n8n Notes

1. [Install the Blotato community nodearrow-up-right](https://help.blotato.com/api/n8n/n8n-blotato-node)

2. If a template shows question marks instead of the Blotato logo, install the Blotato node first, then re-import the template.

3. Create a new Credential in n8n. Go to Blotato Settings > API > Copy API Key. Paste the API key in n8n, save, test, then select this credential on Blotato nodes.

4. Connect social accounts on each platform node. Open each Blotato Publish node, select the Blotato credential, then pick your social account.

5. When testing, deactivate all social platform nodes. Activate just 1 to start with. Run the workflow, then Pin data at the Blotato Publish node. This locks inputs for repeat tests. Then, execute 1 platform node from pinned data to validate it works. Activate other social platforms to continue testing.

6. Use the [Blotato API dashboardarrow-up-right](https://my.blotato.com/api-dashboard) to review each request, payload, and error message.


### [hashtag](https://help.blotato.com/api/templates/4-viral-news-to-ai-avatar-videos\#make-notes)    Make Notes

n/a

### [hashtag](https://help.blotato.com/api/templates/4-viral-news-to-ai-avatar-videos\#zapier-notes)    Zapier Notes

n/a

### [hashtag](https://help.blotato.com/api/templates/4-viral-news-to-ai-avatar-videos\#faqs)    FAQs

#### [hashtag](https://help.blotato.com/api/templates/4-viral-news-to-ai-avatar-videos\#how-do-i-get-captions-on-my-heygen-avatar-video)    How do I get captions on my Heygen avatar video?

You'll need to change 2 steps:

1. In the CREATE HEYGEN VIDEO step, there is a setting to enable captions. Make sure it's turned on.

2. In the Blotato Publish step, pass the `video_url_caption` from the GET VIDEO step into the mediaUrls parameter. This will use the video version with captions.


Remember to test your workflow after making this change to make sure everything works as expected.

[Previous3 Hackernews to AI Clone Videoschevron-left](https://help.blotato.com/api/templates/3-hackernews-to-ai-clone-videos) [Next5 Automate Instagram Carousels with AI Chatchevron-right](https://help.blotato.com/api/templates/5-automate-instagram-carousels-with-ai-chat)

Last updated 3 months ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# 5 Automate Instagram Carousels with AI Chat | Blotato Help
URL: https://help.blotato.com/api/templates/5-automate-instagram-carousels-with-ai-chat

![Page cover](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252F8PdP4AHthNesyUAQe7m5%252FScreenshot%25202025-09-13%2520at%252010.19.31%25E2%2580%25AFAM.png%3Falt%3Dmedia%26token%3D0857ff69-2e9b-4b04-b1a5-ecc1457fa0da&width=1248&dpr=3&quality=100&sign=8774e33&sv=2)

### [hashtag](https://help.blotato.com/api/templates/5-automate-instagram-carousels-with-ai-chat\#description)    Description

This AI Agent Carousel Maker uses ChatGPT and Blotato to write, generate, and auto-post social media carousels to 5 social platforms: Instagram, Tiktok, Facebook, Twitter, and Pinterest. Simply chat with the AI agent, confirm which prebuilt viral carousel template you want to use, then the AI Agent populates the template with your personalized information and quotes, and posts to social media on autopilot. This is perfect for entrepreneurs, small businesses, content creators, digital marketing agencies, social media marketing agencies, and influencers.

### [hashtag](https://help.blotato.com/api/templates/5-automate-instagram-carousels-with-ai-chat\#platforms)    Platforms

n8n

Make

Zapier

check

### [hashtag](https://help.blotato.com/api/templates/5-automate-instagram-carousels-with-ai-chat\#templates)    Templates

[https://drive.google.com/drive/folders/1G4l\_NZ0EVQAUNsuK6k6bipheKOzsgPzj?usp=sharingarrow-up-right](https://drive.google.com/drive/folders/1G4l_NZ0EVQAUNsuK6k6bipheKOzsgPzj?usp=sharing)

### [hashtag](https://help.blotato.com/api/templates/5-automate-instagram-carousels-with-ai-chat\#tutorials)    Tutorials

Automate Instagram Carousels with AI - YouTube

Tap to unmute

[Automate Instagram Carousels with AI](https://www.youtube.com/watch?v=hXP1PYCtdcA) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=hXP1PYCtdcA)

### [hashtag](https://help.blotato.com/api/templates/5-automate-instagram-carousels-with-ai-chat\#overview)    Overview

Here’s how the automation works:

**1\. Chat: AI Agent Carousel Maker**

- Chat with AI agent about your desired carousel

- Confirm quotes and carousel template to use


**2\. Carousel Generation**

- AI agent calls corresponding Blotato tool to generate carousel

- Wait and fetch completed carousel


**3\. Publish to Social Media via Blotato**

- Choose your social accounts

- Either post immediately or schedule for later


### [hashtag](https://help.blotato.com/api/templates/5-automate-instagram-carousels-with-ai-chat\#setup)    Setup

- Sign up for OpenAPI API access and create credential

- Sign up for Blotato.com

- Generate Blotato API Key by going to Settings > API > Generate API Key (paid feature only)

- Create Blotato credential

- If you're using n8n, [install the Blotato community nodearrow-up-right](https://help.blotato.com/api/n8n/n8n-blotato-node)

- Click ""Open chat"" to test workflow

- Complete SETUP sticky notes in BROWN in this template

- AFTER your first successful run, open each carousel template tool call (i.e. pink nodes attached to AI Agent Carousel Maker) and tweak the parameters, but DO NOT change ""quotes"" parameter unless you're an n8n expert.


### [hashtag](https://help.blotato.com/api/templates/5-automate-instagram-carousels-with-ai-chat\#tips-and-tricks)    Tips & Tricks

- While testing: enable only 1 social platform, and deactivate the rest for testing purposes. Add optional parameter 'scheduledTime' so that you don't accidentally post to social media. Check your content calendar here: https://my.blotato.com/queue/schedules

- Check how your carousels look in Blotato app: https://my.blotato.com/videos

- You can browse all video/carousel templates and get a sense of how they work by making them in the Blotato web app first: https://my.blotato.com/videos

- When adding a new template, DO NOT duplicate an existing node. Instead, click '+ Tool' > Blotato Tool > Video > Create > select new template. This ensures template parameters are correctly loaded.


### [hashtag](https://help.blotato.com/api/templates/5-automate-instagram-carousels-with-ai-chat\#troubleshooting)    Troubleshooting

- View all video/carousel templates available: https://my.blotato.com/videos/new

- DO NOT edit the 'quotes' parameter unless you're an n8n expert

- When adding a new template, DO NOT duplicate an existing node. Instead, click '+ Tool' > Blotato Tool > Video > Create > select new template. This ensures template parameters are correctly loaded.


If you need help troubleshooting your automation:

- the [API Dashboardarrow-up-right](https://my.blotato.com/api-dashboard) is your best friend

- go to my.blotato.com and click the ORANGE BUTTON in the bottom right corner to send me a support message


Other helpful links:

**👉** [**Blotato API Docs** arrow-up-right](https://help.blotato.com/api)

✅ [**Troubleshoot Errors** arrow-up-right](https://my.blotato.com/api-dashboard)

📷 [**Media Requirements** arrow-up-right](https://help.blotato.com/api/media)

### [hashtag](https://help.blotato.com/api/templates/5-automate-instagram-carousels-with-ai-chat\#n8n-notes)    n8n Notes

1. [Install the Blotato community nodearrow-up-right](https://help.blotato.com/api/n8n/n8n-blotato-node)

2. If a template shows question marks instead of the Blotato logo, install the Blotato node first, then re-import the template.

3. Create a new Credential in n8n. Go to Blotato Settings > API > Copy API Key. Paste the API key in n8n, save, test, then select this credential on Blotato nodes.

4. Connect social accounts on each platform node. Open each Blotato Publish node, select the Blotato credential, then pick your social account.

5. When testing, deactivate all social platform nodes. Activate just 1 to start with. Run the workflow, then Pin data at the Blotato Publish node. This locks inputs for repeat tests. Then, execute 1 platform node from pinned data to validate it works. Activate other social platforms to continue testing.

6. Use the [Blotato API dashboardarrow-up-right](https://my.blotato.com/api-dashboard) to review each request, payload, and error message.


### [hashtag](https://help.blotato.com/api/templates/5-automate-instagram-carousels-with-ai-chat\#make-notes)    Make Notes

n/a

### [hashtag](https://help.blotato.com/api/templates/5-automate-instagram-carousels-with-ai-chat\#zapier-notes)    Zapier Notes

n/a

### [hashtag](https://help.blotato.com/api/templates/5-automate-instagram-carousels-with-ai-chat\#faqs)    FAQs

#### [hashtag](https://help.blotato.com/api/templates/5-automate-instagram-carousels-with-ai-chat\#how-do-i-request-new-carousel-templates)    How do I request new carousel templates?

Contact Sabrina via in-app chat in the bottom right corner with an example of your desired carousel template, desired inputs, and any other helpful information.

[Previous4 Viral News to AI Avatar Videoschevron-left](https://help.blotato.com/api/templates/4-viral-news-to-ai-avatar-videos) [Next7 Clone Viral Reels with AI Avatarchevron-right](https://help.blotato.com/api/templates/7-clone-viral-reels-with-ai-avatar)

Last updated 3 months ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# 10 Gamma Templates | Blotato Help
URL: https://help.blotato.com/api/templates/10-gamma-templates

![Page cover](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252FTTnWGX0vrviV8u7fORmh%252FYT%2520Thumbnails%2520%281%29.png%3Falt%3Dmedia%26token%3Dd7c52d53-78ad-4c84-891b-99f6e3ebe994&width=1248&dpr=3&quality=100&sign=4b9b69c9&sv=2)

### [hashtag](https://help.blotato.com/api/templates/10-gamma-templates\#description)    Description

You can now use [Gammaarrow-up-right](https://gamma.app/) to create presentations and social media carousels, using your own custom branded template, then post them automatically on social media!

### [hashtag](https://help.blotato.com/api/templates/10-gamma-templates\#platforms)    Platforms

n8n

Make

Zapier

check

check

### [hashtag](https://help.blotato.com/api/templates/10-gamma-templates\#templates)    Templates

[https://drive.google.com/drive/folders/1D-0ymRpDDAH0yV9FrYf2Uy2p5B7HeVa6?usp=sharingarrow-up-right](https://drive.google.com/drive/folders/1D-0ymRpDDAH0yV9FrYf2Uy2p5B7HeVa6?usp=sharing)

### [hashtag](https://help.blotato.com/api/templates/10-gamma-templates\#tutorials)    Tutorials

Gamma AI AUTOMATES your Social Media (n8n & Make) - YouTube

Tap to unmute

[Gamma AI AUTOMATES your Social Media (n8n & Make)](https://www.youtube.com/watch?v=VPg0zqLnuHs) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=VPg0zqLnuHs)

### [hashtag](https://help.blotato.com/api/templates/10-gamma-templates\#use-cases)    Use Cases

- Repurpose AI meeting notes into education carousels

- Convert long and short-form videos into carousels

- Convert Google testimonials into social posts

- Daily industry news recap carousel


### [hashtag](https://help.blotato.com/api/templates/10-gamma-templates\#overview)    Overview

Here’s how the automation works:

- Check Google Sheet daily

- Create carousel using Gamma template

- Convert carousel from PDF to PNG images using CloudConvert

- Post carousel to social platforms using Blotato

- Update item’s “Posted” status in Google sheet


### [hashtag](https://help.blotato.com/api/templates/10-gamma-templates\#setup-accounts)    Setup Accounts

- 1\. Sign up for:



  - Gamma.app

  - CloudConvert.com

  - Blotato.com


2\. Generate API Keys:

  - Gamma API Key: [https://gamma.app/settings/api-keysarrow-up-right](https://my.blotato.com/settings/api)

  - CloudConvert API Key: [https://cloudconvert.com/dashboard/api/v2/keysarrow-up-right](https://my.blotato.com/settings/api)

  - Blotato API Key: [https://my.blotato.com/settings/apiarrow-up-right](https://my.blotato.com/settings/api)


3\. Ensure you have “Verified Community Nodes” enabled in your n8n Admin Panel

4\. Open n8n Settings and install nodes:

  - @blotato/n8n-nodes-blotato

  - @gammatech/n8n-nodes-gamma

  - @cloudconvert/n8n-nodes-cloudconvert


5\. Create CREDENTIALS for Blotato, Gamma, and CloudConvert

6\. Connect your [Google Drive to n8narrow-up-right](https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service)

### [hashtag](https://help.blotato.com/api/templates/10-gamma-templates\#setup-workflow)    Setup Workflow

1\. Copy this [sample Google Sheetarrow-up-right](https://docs.google.com/spreadsheets/d/1UTskvZDjeLqwriXgo3KERlYR7s4iBCLT7L_B5Xepu9c/edit?usp=sharing) … and configure SETUP 1.

Do NOT change columns, unless you know what you’re doing

2\. SETUP 2: Connect Gamma credential & input Gamma template ID

3\. SETUP 3: Connect CloudConvert credential

4\. SETUP 4: Connect Blotato credential and select social media account to post to

5\. Execute workflow and check to see your posts:

- Blotato API Dashboard: [https://my.blotato.com/api-dashboardarrow-up-right](https://my.blotato.com/api-dashboard)

- Blotato Calendar: [https://my.blotato.com/queue/schedulesarrow-up-right](https://my.blotato.com/queue/schedules)


### [hashtag](https://help.blotato.com/api/templates/10-gamma-templates\#tips-and-tricks)    Tips & Tricks

- While testing: enable only 1 social platform, and deactivate the rest for testing purposes. You can also use the option "Scheduled Time" while testing, so that posts are scheduled in the future, not posted immediately.

- After the workflow finishes, check your social media account for the final post.

- If successful, then enable another social media node, and continue testing.


### [hashtag](https://help.blotato.com/api/templates/10-gamma-templates\#troubleshooting)    Troubleshooting

- the [API Dashboardarrow-up-right](https://my.blotato.com/api-dashboard) is your best friend

- go to Blotato and click the ORANGE BUTTON in the bottom right corner to send me a message


Other helpful links:

**👉** [**Blotato API Docs** arrow-up-right](https://help.blotato.com/api)

✅ [**Troubleshoot Errors** arrow-up-right](https://my.blotato.com/api-dashboard)

📷 [**Media Requirements** arrow-up-right](https://help.blotato.com/api/media)

### [hashtag](https://help.blotato.com/api/templates/10-gamma-templates\#n8n-notes)    n8n Notes

1. The Make and n8n templates are IDENTICAL IN LOGIC. However, n8n requires more setup installing verified community nodes.

2. Unfortunately, the n8n nodes for Gamma and CloudConvert are limited (e.g. Gamma node lacks PDF export), so I resort to raw HTTP calls.


### [hashtag](https://help.blotato.com/api/templates/10-gamma-templates\#make-notes)    Make Notes

n/a

### [hashtag](https://help.blotato.com/api/templates/10-gamma-templates\#zapier-notes)    Zapier Notes

n/a

[Previous8 Repurpose Tiktoks On Autopilotchevron-left](https://help.blotato.com/api/templates/8-repurpose-tiktoks-on-autopilot) [Nextn8nchevron-right](https://help.blotato.com/api/n8n)

Last updated 3 months ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# n8n | Blotato Help
URL: https://help.blotato.com/api/n8n

[1 Post Everywherechevron-right](https://help.blotato.com/api/n8n/n8n-basics) [n8n AI Clonechevron-right](https://help.blotato.com/api/n8n/n8n-ai-clone) [n8n Faceless Videoschevron-right](https://help.blotato.com/api/n8n/n8n-faceless-videos) [n8n Slideshows & Carouselschevron-right](https://help.blotato.com/api/n8n/n8n-slideshows-and-carousels) [n8n Repost Tiktoks Everywherechevron-right](https://help.blotato.com/api/n8n/n8n-repost-tiktoks-everywhere) [n8n Blotato Nodechevron-right](https://help.blotato.com/api/n8n/n8n-blotato-node) [FAQschevron-right](https://help.blotato.com/api/n8n/faqs)

[Previous10 Gamma Templateschevron-left](https://help.blotato.com/api/templates/10-gamma-templates) [Next1 Post Everywherechevron-right](https://help.blotato.com/api/n8n/n8n-basics)

Last updated 1 year ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# 1 Post Everywhere | Blotato Help
URL: https://help.blotato.com/api/n8n/n8n-basics

### [hashtag](https://help.blotato.com/api/n8n/n8n-basics\#how-it-works)    How It Works

This automation publishes to 9 social platforms daily! Manage your content in a simple Google Sheet. When you set a post's status to "Ready to Post" in your Google Sheet, this workflow grabs your image/video from Google Drive, posts to 9 social platforms, then updates the post status to "Posted".

### [hashtag](https://help.blotato.com/api/n8n/n8n-basics\#tutorials)    Tutorials

- Youtube tutorial: [https://youtu.be/AB\_5ifmBqec?si=2f5jQeEhoz5Y8YWMarrow-up-right](https://youtu.be/AB_5ifmBqec?si=2f5jQeEhoz5Y8YWM)

- Newsletter tutorial: [https://www.sabrina.dev/p/easy-social-media-posting-n8n-makearrow-up-right](https://www.sabrina.dev/p/easy-social-media-posting-n8n-make)

- Template: [https://drive.google.com/drive/folders/1YphrE-bclOAxsq33cVQ1Ku-NmhQ0dJxv?usp=drive\_linkarrow-up-right](https://drive.google.com/drive/folders/1YphrE-bclOAxsq33cVQ1Ku-NmhQ0dJxv?usp=drive_link)


Easy social media system in n8n & Make - YouTube

Tap to unmute

[Easy social media system in n8n & Make](https://www.youtube.com/watch?v=AB_5ifmBqec) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=AB_5ifmBqec)

[Previousn8nchevron-left](https://help.blotato.com/api/n8n) [Nextn8n AI Clonechevron-right](https://help.blotato.com/api/n8n/n8n-ai-clone)

Last updated 7 months ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# n8n AI Clone | Blotato Help
URL: https://help.blotato.com/api/n8n/n8n-ai-clone

This Workflow Auto Posts in 7 Different Socials (Free Template) - YouTube

Tap to unmute

[This Workflow Auto Posts in 7 Different Socials (Free Template)](https://www.youtube.com/watch?v=8sPYxqU1SoQ) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=8sPYxqU1SoQ)

Here’s the link to download the prebuilt n8n template: [n8n template linkarrow-up-right](https://drive.google.com/file/d/1IhELowUjDXEl-UsOKpnKnxn__twe3GpR/view?usp=sharing)

Learn how to build a fully automated AI Avatar Social Media system that creates talking head AI clone videos, WITHOUT having to film or edit yourself.

This tutorial combines n8n, AI tools agent, HeyGen, and Blotato to research, write, create, and distribute talking head AI clone videos to every social media platform every single day. 100% automated.

- n8n - workflow automation that runs daily

- AI agent - uses HackerNews and ChatGPT

- Heygen - create realistic AI clone/avatar

- Blotato - publish to all social platforms


Here’s the Youtube version of this post:

## [hashtag](https://help.blotato.com/api/n8n/n8n-ai-clone\#prerequisites)    Prerequisites

Before diving into the workflow, ensure you have the following accounts set up:

- n8n: you can use the cloud-hosted version or host it yourself

- API Accounts and Keys:



  - Heygen: generate AI avatar videos

  - Blotato: publish to social platforms

  - OpenAI: generate scripts and captions


## [hashtag](https://help.blotato.com/api/n8n/n8n-ai-clone\#step-1-import-template-into-n8n)    Step 1: Import Template into n8n

Download Template: scroll to the bottom of this page to download the n8n template!

🛑 Scroll to the bottom of this newsletter to get the n8n template to import!

Import into n8n:

- Open n8n

- Click “Create Workflow”

- Click 3 dots

- Click “Import from File”


Review Workflow:

Once imported, you will see a series of nodes visually connected.

This template automates several tasks: scheduling, fetching news, generating scripts, creating the AI avatar video, and finally publishing to social media.

## [hashtag](https://help.blotato.com/api/n8n/n8n-ai-clone\#step-2.-understand-the-workflow)    Step 2. Understand the Workflow

This JSON template is a complete pipeline that automates content creation and distribution. Here’s a breakdown of its primary components:

### [hashtag](https://help.blotato.com/api/n8n/n8n-ai-clone\#id-1.-schedule-trigger)    1\. Schedule Trigger:

- Purpose: Automatically trigger the workflow every day (or at the set hour).

- How it Works: The node “Schedule Trigger” is configured to start the process at 10 AM daily. Adjust the schedule as needed.


### [hashtag](https://help.blotato.com/api/n8n/n8n-ai-clone\#id-2.-news-fetching-and-content-generation)    2\. News Fetching and Content Generation:

- Fetching Trending News:



  - Tools Involved: “Fetch HN Front Page” and “Fetch HN Article.”

  - Function: These nodes use HackerNews data to pull the top 10 stories related to AI or LLMs from the last 24 hours.


- Script Generation by AI Agent:



  - Node: “AI Agent”

  - Function: This node instructs the agent to pick the most viral story, fetch the article along with its comments, and then generate a 30-second script using a defined prompt. I tell ChatGPT to include detailed information, statistics, and a striking viral hook at the beginning.


### [hashtag](https://help.blotato.com/api/n8n/n8n-ai-clone\#id-3.-caption-creation)    3\. Caption Creation:

- Write Long Caption:



  - Write a summary paragraph, 3 bullet point questions, and hashtags.


- Write Short Caption:



  - Write 2-sentence summary for Twitter, Threads, Bluesky.


![](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2Fmedia.beehiiv.com%2Fcdn-cgi%2Fimage%2Ffit%3Dscale-down%2Cformat%3Dauto%2Conerror%3Dredirect%2Cquality%3D80%2Fuploads%2Fasset%2Ffile%2F014301dd-0981-49db-9779-4d832ca36bd0%2Fimage.png%3Ft%3D1744479925&width=768&dpr=3&quality=100&sign=fa139824&sv=2)

### [hashtag](https://help.blotato.com/api/n8n/n8n-ai-clone\#id-4.-ai-avatar-video-creation)    4\. AI Avatar Video Creation:

- Setup Heygen:



  - Prepares parameters for video creation, including background, avatar, and voice.


- Create Avatar Video:



  - Calls the Heygen API to generate the video based on the AI-generated script and selected avatar settings.


- Wait :



  - Ensures there’s enough time for the video to be made, before retrieving the video URL via the "Get Avatar Video" node.


![](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2Fmedia.beehiiv.com%2Fcdn-cgi%2Fimage%2Ffit%3Dscale-down%2Cformat%3Dauto%2Conerror%3Dredirect%2Cquality%3D80%2Fuploads%2Fasset%2Ffile%2F3d5d6f7e-a573-4a44-8963-429d64a8872b%2Fimage.png%3Ft%3D1744479878&width=768&dpr=3&quality=100&sign=6f0e918b&sv=2)

### [hashtag](https://help.blotato.com/api/n8n/n8n-ai-clone\#id-5.-social-media-posting)    5\. Social Media Posting:

- Publishing:



  - Pass the video URL directly to the Blotato Publish nodes - no upload step required.

  - Use Blotato API to post the video + captions to all social platforms.

  - The Blotato API currently doesn't support posting video to Bluesky or Pinterest, so those nodes are deactivated for now. This feature will be available soon, so I left these nodes in the template.


Note: The original YouTube tutorial shows an UPLOAD node, but this step is no longer required. Pass your image/video URLs directly into the `mediaUrls` parameter in the Publish node.

![](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2Fmedia.beehiiv.com%2Fcdn-cgi%2Fimage%2Ffit%3Dscale-down%2Cformat%3Dauto%2Conerror%3Dredirect%2Cquality%3D80%2Fuploads%2Fasset%2Ffile%2F331186b1-574f-4128-98d7-b433b84ab135%2Fimage.png%3Ft%3D1744479889&width=768&dpr=3&quality=100&sign=4805bd1b&sv=2)

## [hashtag](https://help.blotato.com/api/n8n/n8n-ai-clone\#step-3.-setup-and-run-workflow)    Step 3. Setup & Run Workflow

💡 IMPORTANT: the only 2 nodes where you need to edit the values are “Setup Heygen” and “Prepare for Publish”. Don’t tweak anything else, until the entire workflow is smoothly running and posting to your socials.

Setup Heygen:

- Paste your Heygen API key

- Paste your Heygen avatar ID

- Paste your Heygen voice ID

- Use the `background_video_url` that is already filled out (change it later, after ensuring everything works)


Prepare for Publish:

- Paste your Blotato API key

- Paste your Blotato account IDs

- Paste your Facebook page ID


If a social platform is not used, keep its node disabled. You don’t need to fill out the account ID for platforms you’re not publishing to.

1st Test Run:

Enable only 1 social platform, and deactivate the rest for testing purposes. Update the AI agent node’s prompt to return a 5-second script, rather than 30 seconds, to reduce the processing duration. Update the “Wait” node to wait for 2 minutes, rather than 8 minutes, since you’re testing with a super short script.

Now you’re ready to test the entire workflow!

Go to Heygen and check that your avatar video is being processed.

After the workflow finishes, check your social media account for the final post.

If successful, then enable another social media node, and continue testing!

[Previous1 Post Everywherechevron-left](https://help.blotato.com/api/n8n/n8n-basics) [Nextn8n Faceless Videoschevron-right](https://help.blotato.com/api/n8n/n8n-faceless-videos)

Last updated 3 months ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# n8n Faceless Videos | Blotato Help
URL: https://help.blotato.com/api/n8n/n8n-faceless-videos

This is the EASIEST n8n/Make AI agent system that creates faceless AI videos and posts them to all social platforms, without having to sign up for multiple tools to generate AI images, videos, voice, and stitch everything together.

Faceless AI videos are [blowing up on social mediaarrow-up-right](https://www.tiktok.com/@dayli.pov), getting millions of views.

Anyone can start making them today, without expertise in video editing.

Here's the n8n template to import: [n8n templatearrow-up-right](https://drive.google.com/file/d/1ASkABU6tk9vOOGDMUWKISzOnGZ_PZj_o/view?usp=sharing)

How I Built an AI Agent to Create Faceless YouTube Videos (No-Code) - YouTube

Tap to unmute

[How I Built an AI Agent to Create Faceless YouTube Videos (No-Code)](https://www.youtube.com/watch?v=0qf0blCB4Mc) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=0qf0blCB4Mc)

Here’s a [sample videoarrow-up-right](https://database.blotato.io/storage/v1/object/public/public_media/4ddd33eb-e811-4ab5-93e1-2cd0b7e8fb3f/videogen2-render-65fdee14-f35b-46e7-9ee8-2e43e966a289.mp4) created by this automation — including the animated images, voiceover, and captions 😎 using image model “Recraft” and video model “Framepack”.

* * *

## [hashtag](https://help.blotato.com/api/n8n/n8n-faceless-videos\#overview)    Overview

A single n8n/Make workflow that:

1. **Generates** a faceless video idea and script

2. **Turns** that script into a full AI video

3. **Posts** to 7 social platforms​


* * *

## [hashtag](https://help.blotato.com/api/n8n/n8n-faceless-videos\#prerequisites)    Prerequisites

Tool

Why you need it

Links

**n8n or Make**

Runs the no-code workflow

[https://n8n.ioarrow-up-right](https://n8n.io/)

[https://make.comarrow-up-right](https://make.com/)

**Blotato**

Generates video & posts to social platforms

[https://blotato.comarrow-up-right](https://blotato.com/)

**ChatGPT**

Write script & caption

[https://platform.openai.com/arrow-up-right](https://platform.openai.com/)

* * *

## [hashtag](https://help.blotato.com/api/n8n/n8n-faceless-videos\#step-1-import-the-template)    Step 1. Import the template

1. **Download** the JSON file (top of this chat).

2. In n8n or Make, click **Import**

3. The full workflow should appear


* * *

## [hashtag](https://help.blotato.com/api/n8n/n8n-faceless-videos\#step-2-setup)    Step 2. Setup

To get the workflow running for the first time, **you only need to configure 2 nodes:**

1. Prepare Video


Here’s how the node looks. The only field you need to fill out is `blotato_api_key` which you can get [herearrow-up-right](https://help.blotato.com/settings/api-keys).

Copy

```
{
  "blotato_api_key": "",
  "template": "empty",
  "voiceId": "elevenlabs/eleven_multilingual_v2/JBFqnCBsd6RMkjVDRZzb",
  "captionPosition": "bottom",
  "script": {{ $('AI Agent').item.json.output.toJsonString() }},
  "style": "cinematic",
  "animate_first_image": true,
  "animate_all": false,
  "text_to_image_model": "replicate/recraft-ai/recraft-v3",
  "image_to_video_model": "fal-ai/framepack"
}
```

1. Prepare to Publish


Here’s how the node looks. For your 1st test, the only fields you need to fill out are:

- `blotato_api_key`

- `instagram_id` OR `tiktok_id`


After your first test succeeds, then you can test all your other social account IDs.

Copy

```
{
  "blotato_api_key": "",
  "instagram_id": "",
  "youtube_id": "",
  "tiktok_id": "",
  "facebook_id": "",
  "facebook_page_id": "",
  "threads_id": "",
  "twitter_id": "",
  "linkedin_id": "",
  "pinterest_id": "",
  "pinterest_board_id": "",
  "bluesky_id": "",
  "final_text_long": {{ $('Prepare Video').item.json.script.caption.toJsonString() }},
  "final_text_short": {{ $('Prepare Video').item.json.script.caption.toJsonString() }}
}
```

* * *

## [hashtag](https://help.blotato.com/api/n8n/n8n-faceless-videos\#step-3-understand-how-ai-creates-yo)    Step 3. Understand How AI Creates Your Video

The heavy lifting happens in the **Create Video** node, which calls Blotato API to generate your faceless video. Here is the [API documentationarrow-up-right](https://help.blotato.com/api/api-reference/create-video).

Copy

```
{
  "template": {
    "id": "{{ $json.template }}"
    "voiceId": "elevenlabs/eleven_multilingual_v2/JBFqnCBsd6RMkjVDRZzb",
    "captionPosition": "top",
  },
  "script": {{ $json.script.script.toJsonString() }},
  "style": "{{ $json.style }}",
  "animateFirstImage": {{ $json.animate_first_image }},
  "animateAll": {{ $json.animate_all }},
  "textToImageModel": "{{ $json.text_to_image_model }}",
  "imageToVideoModel": "{{ $json.image_to_video_model }}"
}
```

The prebuilt template injects your variables automatically, as defined in the `Prepare Video` node, so you don’t have to touch anything right now.

If you want Blotato to take your script and transform it into a **POV style video**, set `id` to `base/pov/wakeup` in the “Prepare Video” node. Viral POV videos typically don’t have an AI voiceover, so this template will disable the AI voiceover.

If you want Blotato to **take your script as is**, without transforming it into POV style, set `id` to `empty` in the “Prepare Video” node. This will generate an AI voiceover reading your script. Here’s the full list of [AI voicesarrow-up-right](https://help.blotato.com/api/api-reference/voice-ids) available.

Here are the parameters available for each video template:

I plan to add many more templates, especially for business/professional videos!

To animate the whole video, not just the first image, make sure to set `animate_all` to `true` in the “Prepare Video” node.

* * *

## [hashtag](https://help.blotato.com/api/n8n/n8n-faceless-videos\#step-4-test-run)    Step 4. Test Run

For your test run, make sure only 1 social platform is enabled. Disable the others.

Don’t touch anything else besides the 2 “prepare” nodes as described above.

Here are common issues and errors:

Symptom

Fix

“401 Unauthorized”

Wrong or expired Blotato API key

Getting video returns “script-ready”

The video isn’t done exporting, so you’ll need to increase wait time.

Social post fails

Check that account ID is correct and that the account is connected in Blotato

Once everything is working, now you can go back and tweak the automation!

For example, you probably want to change the AI agent node’s prompt, which I’ve copied below for reference:

Copy

```
# INSTRUCTIONS

1. Brainstorm 50 different viral faceless video ideas related to theme "Little known history facts about [famous person]".

2. Randomly select 1 of the ideas. Research relevant statistics, dates, and figures related to the specific idea.

3. Write a 15-second video script for a viral faceless video. Use 6th grade language, use active voice, and start with a hook that leaves viewers wanting to know the answer. Do NOT start with a greeting like "Hey there!".

4. Write a 2-sentence video caption, use 6th grade language, no emojis, and append 3 relevant hashtags to the end of the caption, including "#ai".

# OUTPUT FORMAT

In JSON format:

1. Output the script.
2. Output the caption.
```

* * *

## [hashtag](https://help.blotato.com/api/n8n/n8n-faceless-videos\#ai-image-and-video-models)    AI Image and Video Models

Note: This template uses the older `textToImageModel` / `imageToVideoModel` parameters. For new automations, use the CREATE VISUAL node instead, which supports pre-built templates for carousels, slideshows, and videos. See [Visual Templatesarrow-up-right](https://help.blotato.com/api/visuals) for details.

You can also customize the AI image and video models.

The template default AI image model is “recraft” which creates realistic-looking images. I also personally like the image model “flux-pro”.

The template default AI video model is “framepack” which is the cheapest option, so that you don’t accidentally burn lots of credits.

Go [here arrow-up-right](https://help.blotato.com/api/api-reference/create-video) to see the full list of AI models available.

[Previousn8n AI Clonechevron-left](https://help.blotato.com/api/n8n/n8n-ai-clone) [Nextn8n Slideshows & Carouselschevron-right](https://help.blotato.com/api/n8n/n8n-slideshows-and-carousels)

Last updated 23 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# n8n Slideshows & Carousels | Blotato Help
URL: https://help.blotato.com/api/n8n/n8n-slideshows-and-carousels

## [hashtag](https://help.blotato.com/api/n8n/n8n-slideshows-and-carousels\#create-visual-node-recommended)    CREATE VISUAL Node (Recommended)

Use the Blotato CREATE VISUAL node to generate carousels and slideshows from templates:

1. Add a Blotato node and select "Visual" > "Create"

2. Select a template from the dropdown list

3. Keep default inputs and click Execute to instantly make a carousel

4. Update inputs one-by-one to customize

5. Check the [API Dashboardarrow-up-right](https://my.blotato.com/api-dashboard) to see the JSON payload for each template


Tip: Browse all available templates at https://my.blotato.com/videos/new to see how they work before building your automation.

* * *

## [hashtag](https://help.blotato.com/api/n8n/n8n-slideshows-and-carousels\#legacy-tutorial)    Legacy Tutorial

This AI Agent Automates Slideshows and Carousels

![](https://substackcdn.com/image/youtube/w_728,c_limit/Ev3xBsldyBk)

[This AI Agent Automates Slideshows and Carousels](https://open.substack.com/pub/sabrinaramonov/p/this-ai-agent-automates-slideshows-and-carousels?utm_source=substack&utm_medium=web&utm_content=embedded-post)

Free n8n/Make templates to automate slideshows and carousels for Tiktok, Instagram, and 6 other social platforms

Free n8n/Make templates to automate slideshows and carousels for Tiktok, Instagram, and 6 other social platforms

[![](https://substackcdn.com/image/fetch/$s_!Fq8u!,w_40,h_40,c_fill,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7075ee19-32b3-46ad-bae8-532bf200a103_1080x1080.png)](https://substack.com/)

[Sabrina Ramonov 🍄](https://substack.com/@sabrinaramonov?utm_content=embedded-post)

[Sabrina Ramonov 🍄](https://open.substack.com/pub/sabrinaramonov?utm_source=substack&utm_campaign=embedded-post) [Subscribe](https://www.sabrina.dev/subscribe?utm_source=substack&utm_medium=web&utm_content=embedded-post)

* * *

[15](https://open.substack.com/pub/sabrinaramonov/p/this-ai-agent-automates-slideshows-and-carousels?utm_source=substack&submitLike=true&utm_medium=web&utm_content=embedded-post) [Reply](https://open.substack.com/pub/sabrinaramonov/p/this-ai-agent-automates-slideshows-and-carousels?utm_source=substack&comments=true&utm_medium=web&utm_content=embedded-post) [Share](https://open.substack.com/pub/sabrinaramonov/p/this-ai-agent-automates-slideshows-and-carousels?utm_source=substack&utm_medium=web&utm_content=embedded-post)

May 27, 2025

* * *

[![](https://substackcdn.com/image/fetch/$s_!3cab!,w_24,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack.com%2Ficon%2FSubstackIcon%3Fheight%3D24)Read on Substack](https://open.substack.com/pub/sabrinaramonov/p/this-ai-agent-automates-slideshows-and-carousels?utm_source=substack&utm_medium=web&utm_content=embedded-post)

This n8n AI Agent will AUTOMATE your Carousels and Slideshows 🍄 - YouTube

Tap to unmute

[This n8n AI Agent will AUTOMATE your Carousels and Slideshows 🍄](https://www.youtube.com/watch?v=Ev3xBsldyBk) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=Ev3xBsldyBk)

Here's the n8n template:

[n8n templatearrow-up-right](https://drive.google.com/file/d/1bLUhrYM1wz3kaaw4S-Iifu1ZtlcKc3jp/view?usp=sharing&utm_source=www.sabrina.dev&utm_medium=referral&utm_campaign=this-ai-agent-automates-slideshows-and-carousels)

### [hashtag](https://help.blotato.com/api/n8n/n8n-slideshows-and-carousels\#how-do-you-create-carousels-and-slideshows-with-your-own-images-and-videos)    How do you create carousels and slideshows with your own images and videos?

You don't need to use Blotato's AI generated images for your slideshow. You can use any images that have a publicly accessible URL.

Open the PUBLISH TO INSTAGRAM/TIKTOK steps. Submit a `mediaUrls` array that contains your final images for the carousel. You can pass any publicly accessible image/video URL directly - no upload step required.

I recommend switching to the n8n/Make official Blotato nodes. Much easier instead of fiddling with JSON. Check out this tutorial and template:

[https://youtu.be/AB\_5ifmBqecarrow-up-right](https://youtu.be/AB_5ifmBqec)

[Previousn8n Faceless Videoschevron-left](https://help.blotato.com/api/n8n/n8n-faceless-videos) [Nextn8n Repost Tiktoks Everywherechevron-right](https://help.blotato.com/api/n8n/n8n-repost-tiktoks-everywhere)

Last updated 2 months ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# n8n Repost Tiktoks Everywhere | Blotato Help
URL: https://help.blotato.com/api/n8n/n8n-repost-tiktoks-everywhere

n8n template:

[https://drive.google.com/file/d/1OKl0ik4Cdh2lOV\_K436ZOB-B23n8sWM2/view?usp=sharingarrow-up-right](https://drive.google.com/file/d/1OKl0ik4Cdh2lOV_K436ZOB-B23n8sWM2/view?usp=sharing)

Repurposing your existing content is the EASIEST 10x growth multiplier for intermediate-level creators.

I personally repost all my Tiktoks to Instagram, and I’ve grown from 0 to 350k Instagram followers in less than 1 year. 100% automated. If Tiktok gets banned in your country, you’ll be glad you started reposting, and this only takes 15 minutes to setup.

This is a fully automated Tiktok Repost Engine that takes your latest Tiktok video and repurposes it to 8 social platforms, while also saving a copy to your Google Drive.

The beauty is:

_**No extra work!**_

_Just post on Tiktok like you normally do._

_This automation takes care of everything else on autopilot._

How I repurpose Tiktoks automatically (simple n8n automation) - YouTube

Tap to unmute

[How I repurpose Tiktoks automatically (simple n8n automation)](https://www.youtube.com/watch?v=yHbyEb-fBGY) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=yHbyEb-fBGY)

It reposts every new TikTok you publish to Instagram Reels, YouTube Shorts, Pinterest, Facebook, LinkedIn, Twitter, Threads, Bluesky, and Google Drive.

You don’t need to write any code. You don’t need to change your content habits. Just post Tiktoks like normal, everything syncs behind the scenes.

I use the following tools:

- n8n - workflow automation

- [RSS.apparrow-up-right](http://rss.app/) \- gets your latest tiktok video

- [Blotato.comarrow-up-right](http://blotato.com/) \- repurpose tiktok to other social platforms


* * *

If your automation fails:

1\. Go to Blotato > API Dashboard

2\. Click the failed request to view details

3\. Check the error message

Common issues:

\- Wrong API key

\- Google Drive folder not public

\- YouTube title exceeds 100 characters

* * *

### [hashtag](https://help.blotato.com/api/n8n/n8n-repost-tiktoks-everywhere\#recap)    Recap

To recap the 3 setup steps:

1. Input your RSS Feed from RSS.app

2. Setup Google Drive folder with public access

3. Setup Blotato account with API key and social account IDs


Once the automation is configured, all you have to do:

1\. Post videos on TikTok like normal

2\. Let the automation trigger via RSS

3\. Your videos will be downloaded and reposted automatically!

[Previousn8n Slideshows & Carouselschevron-left](https://help.blotato.com/api/n8n/n8n-slideshows-and-carousels) [Nextn8n Blotato Nodechevron-right](https://help.blotato.com/api/n8n/n8n-blotato-node)

Last updated 9 months ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# n8n Blotato Node | Blotato Help
URL: https://help.blotato.com/api/n8n/n8n-blotato-node

The official Blotato community node for n8n: [https://github.com/Blotato-Inc/n8n-nodes-blotatoarrow-up-right](https://github.com/Blotato-Inc/n8n-nodes-blotato)

* * *

## [hashtag](https://help.blotato.com/api/n8n/n8n-blotato-node\#available-operations)    Available Operations

The Blotato node supports the following operations:

Resource

Operation

Description

Post

Publish

Publish a post to social platforms

Media

Upload

Upload media files

Visual

Create

Create visuals from templates (carousels, slideshows)

Visual

Get

Get visual creation status

Source

Create

Resolve content from URLs, text, PDFs, etc.

Source

Get

Get source resolution status and content

* * *

## [hashtag](https://help.blotato.com/api/n8n/n8n-blotato-node\#install-the-blotato-node)    Install the Blotato Node

### [hashtag](https://help.blotato.com/api/n8n/n8n-blotato-node\#n8n-cloud-users)    n8n Cloud Users

1. Go to your n8n Admin Panel > Settings

2. Enable Verified Community Nodes

3. Open any workflow

4. Click the "+" icon in the top right corner

5. Search for "Blotato"

6. Click Install


### [hashtag](https://help.blotato.com/api/n8n/n8n-blotato-node\#self-hosted-n8n-users)    Self-Hosted n8n Users

For Railway, DigitalOcean, Docker, or other self-hosted setups, enable community nodes first:

1. Go to your hosting dashboard (Railway, DigitalOcean, etc.)

2. Open the Environment or Variables tab

3. Add a new variable:



   - Key: `N8N_ENABLE_COMMUNITY_NODES`

   - Value: `true`


4. Save and restart your n8n instance

5. Go to n8n Settings > Community Nodes

6. Search for "Blotato" and install


You may need to restart your n8n docker container as well.

* * *

## [hashtag](https://help.blotato.com/api/n8n/n8n-blotato-node\#update-the-blotato-node)    Update the Blotato Node

1. Go to n8n Settings > Community Nodes

2. Find the Blotato node and click Options

3. Click Update


* * *

## [hashtag](https://help.blotato.com/api/n8n/n8n-blotato-node\#using-source-operations)    Using Source Operations

The Source operations allow you to resolve content from various sources programmatically.

### [hashtag](https://help.blotato.com/api/n8n/n8n-blotato-node\#supported-source-types)    Supported Source Types

Source Type

Input

Description

text

Text content

Plain text

article

URL

Web article or blog post

youtube

URL

YouTube video

twitter

URL

Twitter/X post

tiktok

URL

TikTok video

perplexity-query

Text query

Perplexity AI search

audio

URL

Audio file

pdf

URL

PDF document

### [hashtag](https://help.blotato.com/api/n8n/n8n-blotato-node\#create-source)    Create Source

1. Add a Blotato node

2. Select Resource: "Source"

3. Select Operation: "Create"

4. Choose the source type

5. Provide the URL or text input

6. Execute to get a resolution ID


### [hashtag](https://help.blotato.com/api/n8n/n8n-blotato-node\#get-source)    Get Source

1. Add another Blotato node

2. Select Resource: "Source"

3. Select Operation: "Get"

4. Pass the resolution ID from the Create step

5. Execute to get the resolved content (title, content, referenceUrl)


Add a Wait node between Create and Get if processing takes time (e.g., for long videos or PDFs).

For full API details, see: [Source API Referencearrow-up-right](https://github.com/Blotato-Inc/help.blotato.com/blob/main/api/api-reference/source.md)

* * *

## [hashtag](https://help.blotato.com/api/n8n/n8n-blotato-node\#troubleshooting)    Troubleshooting

### [hashtag](https://help.blotato.com/api/n8n/n8n-blotato-node\#template-shows-question-marks-instead-of-the-blotato-logo)    Template shows question marks instead of the Blotato logo?

1. Enable Verified Community Nodes first

2. Install the Blotato node

3. Re-import the n8n template


### [hashtag](https://help.blotato.com/api/n8n/n8n-blotato-node\#need-help)    Need help?

Contact support by clicking the orange button in the bottom right corner within the Blotato app.

[Previousn8n Repost Tiktoks Everywherechevron-left](https://help.blotato.com/api/n8n/n8n-repost-tiktoks-everywhere) [NextFAQschevron-right](https://help.blotato.com/api/n8n/faqs)

Last updated 1 month ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# FAQs | Blotato Help
URL: https://help.blotato.com/api/n8n/faqs

## [hashtag](https://help.blotato.com/api/n8n/faqs\#how-do-i-get-started-with-the-blotato-api-in-n8n)    How do I get started with the Blotato API in n8n?

1. Follow the [Blotato API Quickstartarrow-up-right](https://help.blotato.com/api/start) to get your API key and install the official Blotato n8n node

2. Import one of the [Automation Templatesarrow-up-right](https://help.blotato.com/api/templates) to start with a working workflow

3. To create videos or carousels: add the Blotato CREATE VISUAL node, select a template from the dropdown, and click Execute. Start with a carousel template -- it renders near-instantly so you get a result right away

4. To publish: add the Blotato PUBLISH node. Pass your image/video URLs directly into the `mediaUrls` parameter -- no upload step required


**Important:** If you're using an older template that includes a "Upload to Blotato" or "Media > Upload" node, you can disable or delete it. Media upload is now optional -- you can pass URLs directly to the Publish node's `mediaUrls` parameter. 5. To debug requests: open the [API Dashboardarrow-up-right](https://my.blotato.com/api-dashboard) and click on any request to see the full payload and response

Use the official Blotato n8n node. It handles API keys and account selection through dropdowns, so you do not need to copy/paste IDs or write raw JSON.

* * *

## [hashtag](https://help.blotato.com/api/n8n/faqs\#how-do-i-post-an-instagram-story-instead-of-a-reel)    How do I post an Instagram story instead of a reel?

Open the Instagram publish node in n8n, click "Add Option", select "Media Type", and set it to "Story".

By default, Instagram posts with video publish as Reels. Setting Media Type to "Story" overrides this.

* * *

## [hashtag](https://help.blotato.com/api/n8n/faqs\#how-do-i-post-to-a-linkedin-page-instead-of-personal-linkedin)    How do I post to a LinkedIn page instead of personal LinkedIn?

Open the LinkedIn publish node in n8n, click "Add Option", and select "LinkedIn Page" from the dropdown. This lets you pick which LinkedIn company page to post to.

* * *

## [hashtag](https://help.blotato.com/api/n8n/faqs\#having-issues-with-the-blotato-node-in-n8n)    Having issues with the Blotato node in n8n?

Make sure you follow these instructions to install the official Blotato n8n node: [Install Guidearrow-up-right](https://help.blotato.com/api/start#n8n)

You may need to re-import your workflow template after installing the official Blotato n8n node.

* * *

## [hashtag](https://help.blotato.com/api/n8n/faqs\#how-do-i-use-the-source-nodes-in-n8n)    How do I use the Source nodes in n8n?

The Source nodes allow you to extract content from YouTube, TikTok, articles, PDFs, audio, or AI research queries.

### [hashtag](https://help.blotato.com/api/n8n/faqs\#create-source-node)    Create Source Node

1. Add a Blotato node

2. Select "Source" > "Create"

3. Choose your source type:



   - **URL**: YouTube, TikTok, Article, PDF, or Audio URL (auto-detected)

   - **Text**: Raw text content

   - **AI Research**: Perplexity-powered web search query


4. Optionally add Custom Instructions to transform the extracted content

5. Execute to get a source ID


### [hashtag](https://help.blotato.com/api/n8n/faqs\#get-source-node)    Get Source Node

1. Add a Blotato node after Create Source

2. Select "Source" > "Get"

3. Pass the source ID from Create Source

4. Enable "Clean Transcript" to remove timestamps (recommended)

5. Execute to retrieve the extracted content


### [hashtag](https://help.blotato.com/api/n8n/faqs\#workflow-pattern)    Workflow Pattern

Copy

```
[Create Source] --> [Wait 5-10s] --> [Get Source] --> [Use Content]
```

Add a Wait node between Create and Get because extraction is asynchronous.

### [hashtag](https://help.blotato.com/api/n8n/faqs\#example-youtube-to-visual-content)    Example: YouTube to Visual Content

1. Create Source with YouTube URL

2. Wait 10 seconds

3. Get Source to retrieve transcript

4. Pass transcript to Blotato Create Visual to make carousels or videos

5. Publish to social platforms


### [hashtag](https://help.blotato.com/api/n8n/faqs\#source-node-not-showing)    Source Node Not Showing?

If you don't see the "Source" node in your Blotato n8n node, update to the latest version:

1. Click the "+" icon to add a new node

2. Search for "Blotato"

3. Look for the "UPDATE" button and click it


After updating, the Source node will be available.

Note: Make.com automatically receives updates.

* * *

## [hashtag](https://help.blotato.com/api/n8n/faqs\#troubleshooting-make.com-and-n8n-automations)    Troubleshooting Make.com and n8n Automations

**The most common errors I see are related to:**

- wrong API key or account IDs

- invalid JSON (e.g. wrongly formatted)

- invalid API request (e.g. wrong parameters)

- invalid file format (e.g. wrong video dimensions)

- you're on the free Creatomate plan and you need to upgrade to export correct video dimensions


Tip: Use the official Blotato n8n node to avoid manually copying API keys and account IDs. [Install guidearrow-up-right](https://help.blotato.com/api/n8n/n8n-blotato-node)

**Here's a step-by-step checkllist to troubleshoot your n8n automation:**

- Check your Blotato API key, Account IDs, and Page IDs are correct

- Check that the correct Account ID is connected and passed in every Publish API call

- If you are publishing to a Facebook Page or Linkedin Company Page, you must also pass the Page ID, in addition to Account ID.

- Check your [API Dashboardarrow-up-right](https://my.blotato.com/api-dashboard) \- click on any request to see the full payload, error response, and which account it was sent to

- Verify that the JSON data in the HTTP Request contains the right parameters:


1. Ask ChatGPT to check if your **JSON is valid**.

2. Check it again with JSON Validator: [https://jsonlint.comarrow-up-right](https://jsonlint.com/)

3. If your JSON is valid, ask ChatGPT to **compare your JSON to Blotato's API docs**. Use this prompt:


Copy

```
You are an expert in Blotato API: https://help.blotato.com/api/api-reference/publish-post

Check the following JSON is valid and conforms to the Blotato API:

<json>
PASTE_YOUR_JSON_REQUEST_HERE
</json>
```

* * *

## [hashtag](https://help.blotato.com/api/n8n/faqs\#issues-with-json-request-to-blotato-api)    Issues with JSON Request to Blotato API?

I recommend using ChatGPT to troubleshoot your JSON payload:

1. Ask ChatGPT to check if your **JSON is valid**.

2. Check it again with JSON Validator: [https://jsonlint.comarrow-up-right](https://jsonlint.com/)

3. If your JSON is valid, ask ChatGPT to **compare your JSON to Blotato's API docs**. Use this prompt:


Copy

```
You are an expert in Blotato API: https://help.blotato.com/api/api-reference/publish-post

Check the following JSON is valid and conforms to the Blotato API:

<json>
PASTE_YOUR_JSON_REQUEST_HERE
</json>
```

* * *

## [hashtag](https://help.blotato.com/api/n8n/faqs\#submitting-wrong-video-dimensions-to-api)    Submitting Wrong Video Dimensions to API?

I see a lot of errors related to uploading invalid video dimensions.

For example, if you're on the free Creatomate plan, you need to upgrade in order to export correct video dimensions.

As a sanity check, try uploading this video instead:

[https://database.blotato.io/storage/v1/object/public/public\_media/4ddd33eb-e811-4ab5-93e1-2cd0b7e8fb3f/videogen-4c61a730-7eb2-47e9-a3a3-524740a1b877.mp4arrow-up-right](https://database.blotato.io/storage/v1/object/public/public_media/4ddd33eb-e811-4ab5-93e1-2cd0b7e8fb3f/videogen-4c61a730-7eb2-47e9-a3a3-524740a1b877.mp4)

* * *

## [hashtag](https://help.blotato.com/api/n8n/faqs\#how-to-preserve-newlines-in-multi-paragraph-posts)    How to Preserve Newlines in Multi-Paragraph Posts?

To preserve newlines in posts with multiple paragraphs, use the function toJsonString() in n8n like this:

`"text": $("Prepare for Publish").item.json.final_text_long.toJsonString()`

* * *

## [hashtag](https://help.blotato.com/api/n8n/faqs\#how-do-you-customize-text-styles-in-the-carousel-slideshow)    How do you customize text styles in the carousel/slideshow?

It's on my roadmap to add more customization options and templates for carousels/slideshows!

Right now, the only customization is the caption position (top, middle, bottom).

* * *

## [hashtag](https://help.blotato.com/api/n8n/faqs\#how-do-i-check-if-my-post-was-published-and-get-the-live-url)    How do I check if my post was published and get the live URL?

Use the official Blotato **Get Post** node:

1. Add a Blotato node and select "Post" > "Get"

2. Pass in the `postSubmissionId` from your Publish node response

3. The node returns the post status and, once published, the live URL (e.g., the direct TikTok or Instagram link)


TikTok and other platforms process posts asynchronously, so the published URL is not available immediately after the Publish step. Add a Wait node (10-30 seconds) between Publish and Get Post, or use a loop to poll until the status is `published`.

API docs: [Get Post](https://help.blotato.com/api/publish-post/get-post)

* * *

## [hashtag](https://help.blotato.com/api/n8n/faqs\#how-do-you-post-a-slideshow-or-carousel)    How do you post a slideshow or carousel?

Using the official Blotato node, it's now super easy to post a slideshow or carousel. In your publishing node, update the Media URLs parameter - give it a comma separated list of URLs to be posted as a slideshow/carousel.

* * *

## [hashtag](https://help.blotato.com/api/n8n/faqs\#dont-see-your-facebook-or-linkedin-pages-in-the-n8n-node)    Don't see your Facebook or Linkedin Pages in the n8n node?

As a workaround, switch from `From List` to `By ID`, then copy paste your pageId from Blotato Settings.

![](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252FRvklemM6jN23iJODBAaf%252Fimage.png%3Falt%3Dmedia%26token%3D1c1c1053-3d5d-4785-a5e7-9c54ddae1000&width=768&dpr=3&quality=100&sign=befc0c4b&sv=2)

* * *

## [hashtag](https://help.blotato.com/api/n8n/faqs\#im-using-an-older-template-with-texttoimagemodel-and-imagetovideomodel-parameters.-do-these-still-wo)    I'm using an older template with textToImageModel and imageToVideoModel parameters. Do these still work?

Those parameters belong to an outdated template format. Switch to the new CREATE VISUAL system instead:

1. Browse all available templates at [https://my.blotato.com/videos/newarrow-up-right](https://my.blotato.com/videos/new) to see how they look

2. In n8n or Make, add the Blotato CREATE VISUAL node and select a template

3. Start with a carousel template -- carousels render near-instantly, so you get a fast test run

4. Click Execute to generate the carousel

5. Open your [API Dashboardarrow-up-right](https://my.blotato.com/api-dashboard) to see the JSON payload for each template

6. Override your desired inputs one-by-one


If you were making AI story videos, use the template called "AI Video with AI Voice."

Full documentation for each template: [Visual Templatesarrow-up-right](https://help.blotato.com/api/visuals)

* * *

## [hashtag](https://help.blotato.com/api/n8n/faqs\#my-n8n-workflow-keeps-generating-the-same-content-every-run.-how-do-i-fix-this)    My n8n workflow keeps generating the same content every run. How do I fix this?

This usually happens when nodes have **pinned data** that prevents them from running fresh on each execution.

### [hashtag](https://help.blotato.com/api/n8n/faqs\#quick-fix)    Quick Fix

1. Open your n8n workflow

2. Click each node in your workflow (especially script/AI generation nodes and the Create Visual node)

3. Look for a small **pin icon** in the output panel of each node

4. If you see a pinned icon, click it to **Unpin data**

5. Run your workflow again


### [hashtag](https://help.blotato.com/api/n8n/faqs\#common-causes)    Common Causes

- **Pinned script/AI output**: If your script generation node is pinned, it will reuse the same script every run

- **Pinned Create Visual inputs**: If inputs to Create Visual are pinned, the same content gets generated

- **Pinned source data**: Any upstream nodes with pinned data will prevent fresh content


### [hashtag](https://help.blotato.com/api/n8n/faqs\#prevention)    Prevention

Only pin data temporarily for testing. Always unpin before running production workflows.

If your workflow still generates identical content after unpinning, verify that:

- Your source data actually changes between runs

- Random/variable elements are included in your prompts

- You're not hardcoding static values


* * *

**Didn't find your answer?**

- [General FAQsarrow-up-right](https://github.com/Blotato-Inc/help.blotato.com/blob/main/support/faqs/README.md)

- [API FAQsarrow-up-right](https://github.com/Blotato-Inc/help.blotato.com/blob/main/api/faqs/README.md)

- [Make.com FAQsarrow-up-right](https://github.com/Blotato-Inc/help.blotato.com/blob/main/api/make.com/faqs/README.md)


[Previousn8n Blotato Nodechevron-left](https://help.blotato.com/api/n8n/n8n-blotato-node) [NextMake.comchevron-right](https://help.blotato.com/api/make.com)

Last updated 17 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Make.com | Blotato Help
URL: https://help.blotato.com/api/make.com

Blotato has an official Make.com integration with the following modules:

Resource

Operation

Description

Post

Publish

Publish a post to social platforms

Media

Upload

Upload media files

Visual

Create

Create visuals from templates (carousels, slideshows)

Visual

Get

Get visual creation status

Source

Create

Resolve content from URLs, text, PDFs, etc.

Source

Get

Get source resolution status and content

## [hashtag](https://help.blotato.com/api/make.com\#using-source-modules)    Using Source Modules

The Source modules allow you to resolve content from various sources programmatically.

### [hashtag](https://help.blotato.com/api/make.com\#supported-source-types)    Supported Source Types

Source Type

Input

Description

text

Text content

Plain text

article

URL

Web article or blog post

youtube

URL

YouTube video

twitter

URL

Twitter/X post

tiktok

URL

TikTok video

perplexity-query

Text query

Perplexity AI search

audio

URL

Audio file

pdf

URL

PDF document

### [hashtag](https://help.blotato.com/api/make.com\#create-source)    Create Source

1. Add a Blotato module

2. Select "Create a Source Resolution"

3. Choose the source type

4. Provide the URL or text input

5. Run to get a resolution ID


### [hashtag](https://help.blotato.com/api/make.com\#get-source)    Get Source

1. Add another Blotato module

2. Select "Get a Source Resolution"

3. Pass the resolution ID from the Create step

4. Run to get the resolved content (title, content, referenceUrl)


Add a Sleep module between Create and Get if processing takes time (e.g., for long videos or PDFs).

For full API details, see: [Source API Referencearrow-up-right](https://github.com/Blotato-Inc/help.blotato.com/blob/main/api/api-reference/source.md)

## [hashtag](https://help.blotato.com/api/make.com\#using-visual-modules)    Using Visual Modules

Visual creation is asynchronous. The Create module starts rendering and returns an ID. The Get module checks the status and returns the finished result.

### [hashtag](https://help.blotato.com/api/make.com\#create-visual)    Create Visual

1. Add a Blotato module

2. Select "Create a Visual"

3. Choose a template from the dropdown

4. Fill in the template inputs (prompt, scenes, etc.)

5. Run to get a visual creation ID


### [hashtag](https://help.blotato.com/api/make.com\#get-visual)    Get Visual

1. Add a Sleep module after Create Visual:



   - For carousel/slideshow templates without AI image generation: 45 seconds

   - For templates with AI image generation: 2 minutes


2. Add another Blotato module

3. Select "Get a Visual"

4. Pass the visual creation ID from the Create step

5. Check the `status` field:



   - `done` = visual is ready, use `mediaUrl` or `imageUrls`

   - `creation-from-template-failed` = check inputs and retry

   - Any other status = still processing, add a longer Sleep and retry


### [hashtag](https://help.blotato.com/api/make.com\#scenario-pattern)    Scenario Pattern

Copy

```
[Create Visual] --> [Sleep 45s-2min] --> [Get Visual] --> [Publish Post]
```

The "Create Everything with AI Agent" option is web-app only and not available as a Make.com template. Use a specific template from the dropdown instead.

For full API details, see: [Create Visual API Reference](https://help.blotato.com/api/create-video)

[PreviousFAQschevron-left](https://help.blotato.com/api/n8n/faqs) [NextMake AI Clonechevron-right](https://help.blotato.com/api/make.com/make-ai-clone)

Last updated 9 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Make AI Clone | Blotato Help
URL: https://help.blotato.com/api/make.com/make-ai-clone

**How to Build a Fully Automated AI Clone Video System**

In this guide, I’ll show you how to build a 100% AI-powered system that:

- Automatically researches interesting topics

- Writes a video script

- Generates a video caption

- Creates an AI avatar video

- Publishes the video to multiple social platforms


## [hashtag](https://help.blotato.com/api/make.com/make-ai-clone\#id-1.-base-automation)    1\. Base Automation

Your 100% Automated AI Clone Makes Talking Videos! - YouTube

Tap to unmute

[Your 100% Automated AI Clone Makes Talking Videos!](https://www.youtube.com/watch?v=to1Y42qY6jc) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=to1Y42qY6jc)

## [hashtag](https://help.blotato.com/api/make.com/make-ai-clone\#id-2.-improving-ai-clones-voice)    2\. Improving AI Clone's Voice

100% Automated AI Clone Videos with Professional Voice! - YouTube

Tap to unmute

[100% Automated AI Clone Videos with Professional Voice!](https://www.youtube.com/watch?v=XMNrTbeMLC0) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=XMNrTbeMLC0)

## [hashtag](https://help.blotato.com/api/make.com/make-ai-clone\#id-3.-combining-ai-clones-with-faceless-videos)    3\. Combining AI Clones with Faceless Videos

Your 100% Automated AI Clone Makes Stunning Faceless Videos! - YouTube

Tap to unmute

[Your 100% Automated AI Clone Makes Stunning Faceless Videos!](https://www.youtube.com/watch?v=hqoomzSzsAY) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=hqoomzSzsAY)

This allows you to automate your short-form video creation for platforms like TikTok and Reels.

#### [hashtag](https://help.blotato.com/api/make.com/make-ai-clone\#why-automate)    Why Automate?

Many platforms prioritize short-form video content. With this setup, you can create high-quality AI avatar videos efficiently and distribute them at scale.

#### [hashtag](https://help.blotato.com/api/make.com/make-ai-clone\#overview-of-the-workflow)    Overview of the Workflow

The workflow uses [Make.comarrow-up-right](https://make.com/), but you can adapt it to other automation tools like Zapier or Pipedream. Here’s a high-level breakdown of the process:

1. Research the topic using Perplexity AI.

2. Write the video script and caption with OpenAI’s ChatGPT.

3. Generate an AI avatar video using Heygen.

4. Publish the video to all social platforms with Blotato.


Let’s dive into the step-by-step guide.

* * *

#### [hashtag](https://help.blotato.com/api/make.com/make-ai-clone\#step-1-set-up-the-workflow-in-make.com)    **Step 1: Set Up the Workflow in Make.com**

1. **Create a New Scenario**



   - In Make.com, click "Create a new scenario" and name it (e.g., "AI Clone Base").

   - This base workflow can later be expanded for more complex automations.


2. **Add a Perplexity Module**



   - Search for Perplexity and select "Create a Chat Completion."

   - Connect your API key from Perplexity (available on their website).


3. **Input Your Prompt**


* * *

#### [hashtag](https://help.blotato.com/api/make.com/make-ai-clone\#step-2-write-the-video-caption)    **Step 2: Write the Video Caption**

1. **Add an OpenAI ChatGPT Module**



   - Select "Create a Chat Completion."

   - Use GPT-4o or 4o-mini (depending on task complexity).


2. **Craft the Prompt**



   - Provide an example of an SEO-optimized caption with:



     - A brief summary of the video.

     - Three questions viewers might ask to find this type of content.

     - Relevant hashtags.


3. **Map the Output**



   - Feed the video script from Perplexity into this step to generate the caption.


* * *

#### [hashtag](https://help.blotato.com/api/make.com/make-ai-clone\#step-3-create-the-ai-avatar-video)    **Step 3: Create the AI Avatar Video**

1. **Add Heygen Module**



   - Connect your Heygen account (get your API key from Heygen’s website).


2. **Create Your AI Avatar**



   - If you haven’t already, create an avatar by:



     - Filming 5 minutes of high-quality footage in natural lighting.

     - Speaking directly to the camera without pauses or stitched clips.


   - Upload your footage to Heygen and wait 10–15 minutes for processing.


3. **Configure the Avatar Video**



   - Input the script generated by Perplexity.

   - Select a voice and adjust parameters like pitch, speed, and emotion (e.g., set to "Excited" for a more engaging tone).

   - Use a resolution of 720x1280 for short-form vertical 9:16 videos.

   - To remove the Heygen watermark from your avatar video, follow these instructions: [https://help.heygen.com/en/articles/9803807-how-to-remove-the-heygen-watermarkarrow-up-right](https://help.heygen.com/en/articles/9803807-how-to-remove-the-heygen-watermark)


4. **Add Delays**



   - Insert sleep modules (e.g., 5–10 minutes) to account for processing time.


* * *

#### [hashtag](https://help.blotato.com/api/make.com/make-ai-clone\#step-4-publish-the-video-to-social-platforms)    **Step 4: Publish the Video to Social Platforms**

1. **Connect to Blotato**



   - Get your Blotato API key: [https://help.blotato.com/api/startarrow-up-right](https://help.blotato.com/api/start)

   - In Blotato settings, link all your social media accounts: [https://help.blotato.com/settings/social-accountsarrow-up-right](https://help.blotato.com/settings/social-accounts)


2. **Set Up Publishing Modules**



   - Pass video URLs directly to the Blotato Publish modules - no upload step required.

   - For each platform:



     - Create a JSON object with fields for captions, video URLs, and platform-specific parameters (e.g., privacy settings for TikTok).

     - Add HTTP modules to handle API calls for posting content.


Note: The original YouTube tutorial shows an UPLOAD module, but this step is no longer required. Pass your image/video URLs directly into the `mediaUrls` parameter in the Publish module.

1. **(Optional) Track in Google Sheets**



   - Log all published content in a Google Sheet for easy tracking.

   - Include fields for the date, script, caption, and video URL.

   - Blotato also tracks all your published content, so this step is optional.


* * *

#### [hashtag](https://help.blotato.com/api/make.com/make-ai-clone\#tips-for-success)    **Tips for Success**

1. **Optimize Captions for Search**



   - Use keywords and hashtags to improve discoverability.

   - Platforms like TikTok derive significant views from search results.


2. **Adjust Processing Times**



   - For videos under 30 seconds, a 5-minute delay is usually sufficient.

   - For longer videos, increase the wait time to 8–10 minutes.


3. **Test on Multiple Platforms**



   - Preview each post to ensure it appears correctly on all platforms.

   - Avoid deleting TikTok videos—set them to private instead to avoid penalties.


* * *

#### [hashtag](https://help.blotato.com/api/make.com/make-ai-clone\#misc)    **Misc**

- **Daily Automation**:



  - Schedule the workflow to run daily at a specific time or multiple times per day for consistency.


- **Future Enhancements**:



  - Add YouTube Shorts publishing with Make.com’s YouTube module.

  - Explore advanced audio processing with ElevenLabs for professional-quality voiceovers.


* * *

#### [hashtag](https://help.blotato.com/api/make.com/make-ai-clone\#recap)    **Recap**

In this tutorial, we covered how to:

1. Automate research and scriptwriting with Perplexity and ChatGPT.

2. Create high-quality AI avatar videos using Heygen.

3. Distribute content to multiple platforms with Blotato and Make.com.

4. Track published content in Google Sheets.


With this system, you can efficiently produce and publish short-form videos, freeing up time to focus on strategy and creativity.

[PreviousMake.comchevron-left](https://help.blotato.com/api/make.com) [NextMake Faceless Videoschevron-right](https://help.blotato.com/api/make.com/make-faceless-videos)

Last updated 3 months ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Make Faceless Videos | Blotato Help
URL: https://help.blotato.com/api/make.com/make-faceless-videos

This is the EASIEST n8n/Make AI agent system that creates faceless AI videos and posts them to all social platforms, without having to sign up for multiple tools to generate AI images, videos, voice, and stitch everything together.

Faceless AI videos are [blowing up on social mediaarrow-up-right](https://www.tiktok.com/@dayli.pov), getting millions of views.

Anyone can start making them today, without expertise in video editing.

Here's the Make template to import: [Make templatearrow-up-right](https://drive.google.com/file/d/1StqYbpgOs-PIXcHYuarPvVGgp_DOZjPK/view?usp=sharing)

How I Built an AI Agent to Create Faceless YouTube Videos (No-Code) - YouTube

Tap to unmute

[How I Built an AI Agent to Create Faceless YouTube Videos (No-Code)](https://www.youtube.com/watch?v=0qf0blCB4Mc) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=0qf0blCB4Mc)

Here’s a [sample videoarrow-up-right](https://database.blotato.io/storage/v1/object/public/public_media/4ddd33eb-e811-4ab5-93e1-2cd0b7e8fb3f/videogen2-render-65fdee14-f35b-46e7-9ee8-2e43e966a289.mp4) created by this automation — including the animated images, voiceover, and captions 😎 using image model “Recraft” and video model “Framepack”.

* * *

## [hashtag](https://help.blotato.com/api/make.com/make-faceless-videos\#overview)    Overview

A single n8n/Make workflow that:

1. **Generates** a faceless video idea and script

2. **Turns** that script into a full AI video

3. **Posts** to 7 social platforms​


* * *

## [hashtag](https://help.blotato.com/api/make.com/make-faceless-videos\#prerequisites)    Prerequisites

Tool

Why you need it

Links

**n8n or Make**

Runs the no-code workflow

[https://n8n.ioarrow-up-right](https://n8n.io/)

[https://make.comarrow-up-right](https://make.com/)

**Blotato**

Generates video & posts to social platforms

[https://blotato.comarrow-up-right](https://blotato.com/)

**ChatGPT**

Write script & caption

[https://platform.openai.com/arrow-up-right](https://platform.openai.com/)

* * *

## [hashtag](https://help.blotato.com/api/make.com/make-faceless-videos\#step-1-import-the-template)    Step 1. Import the template

1. **Download** the JSON file (top of this chat).

2. In n8n or Make, click **Import**

3. The full workflow should appear


* * *

## [hashtag](https://help.blotato.com/api/make.com/make-faceless-videos\#step-2-setup)    Step 2. Setup

To get the workflow running for the first time, **you only need to configure 2 nodes:**

1. Prepare Video


Here’s how the node looks. The only field you need to fill out is `blotato_api_key` which you can get [herearrow-up-right](https://help.blotato.com/settings/api-keys).

Copy

```
{
  "blotato_api_key": "",
  "template": "empty",
  "voiceId": "elevenlabs/eleven_multilingual_v2/JBFqnCBsd6RMkjVDRZzb",
  "captionPosition": "bottom",
  "script": {{ $('AI Agent').item.json.output.toJsonString() }},
  "style": "cinematic",
  "animate_first_image": true,
  "animate_all": false,
  "text_to_image_model": "replicate/recraft-ai/recraft-v3",
  "image_to_video_model": "fal-ai/framepack"
}
```

1. Prepare to Publish


Here’s how the node looks. For your 1st test, the only fields you need to fill out are:

- `blotato_api_key`

- `instagram_id` OR `tiktok_id`


After your first test succeeds, then you can test all your other social account IDs.

Copy

```
{
  "blotato_api_key": "",
  "instagram_id": "",
  "youtube_id": "",
  "tiktok_id": "",
  "facebook_id": "",
  "facebook_page_id": "",
  "threads_id": "",
  "twitter_id": "",
  "linkedin_id": "",
  "pinterest_id": "",
  "pinterest_board_id": "",
  "bluesky_id": "",
  "final_text_long": {{ $('Prepare Video').item.json.script.caption.toJsonString() }},
  "final_text_short": {{ $('Prepare Video').item.json.script.caption.toJsonString() }}
}
```

* * *

## [hashtag](https://help.blotato.com/api/make.com/make-faceless-videos\#step-3-understand-how-ai-creates-yo)    Step 3. Understand How AI Creates Your Video

The heavy lifting happens in the **Create Video** node, which calls Blotato API to generate your faceless video. Here is the [API documentationarrow-up-right](https://help.blotato.com/api/api-reference/create-video).

Copy

```
{
  "template": {
    "id": "{{ $json.template }}"
    "voiceId": "elevenlabs/eleven_multilingual_v2/JBFqnCBsd6RMkjVDRZzb",
    "captionPosition": "top",
  },
  "script": {{ $json.script.script.toJsonString() }},
  "style": "{{ $json.style }}",
  "animateFirstImage": {{ $json.animate_first_image }},
  "animateAll": {{ $json.animate_all }},
  "textToImageModel": "{{ $json.text_to_image_model }}",
  "imageToVideoModel": "{{ $json.image_to_video_model }}"
}
```

The prebuilt template injects your variables automatically, as defined in the `Prepare Video` node, so you don’t have to touch anything right now.

If you want Blotato to take your script and transform it into a **POV style video**, set `id` to `base/pov/wakeup` in the “Prepare Video” node. Viral POV videos typically don’t have an AI voiceover, so this template will disable the AI voiceover.

If you want Blotato to **take your script as is**, without transforming it into POV style, set `id` to `empty` in the “Prepare Video” node. This will generate an AI voiceover reading your script. Here’s the full list of [AI voicesarrow-up-right](https://help.blotato.com/api/api-reference/voice-ids) available.

Here are the parameters available for each video template:

I plan to add many more templates, especially for business/professional videos!

To animate the whole video, not just the first image, make sure to set `animate_all` to `true` in the “Prepare Video” node.

* * *

## [hashtag](https://help.blotato.com/api/make.com/make-faceless-videos\#step-4-test-run)    Step 4. Test Run

For your test run, make sure only 1 social platform is enabled. Disable the others.

Don’t touch anything else besides the 2 “prepare” nodes as described above.

Here are common issues and errors:

Symptom

Fix

“401 Unauthorized”

Wrong or expired Blotato API key

Getting video returns “script-ready”

The video isn’t done exporting, so you’ll need to increase wait time.

Social post fails

Check that account ID is correct and that the account is connected in Blotato

Once everything is working, now you can go back and tweak the automation!

For example, you probably want to change the AI agent node’s prompt, which I’ve copied below for reference:

Copy

```
# INSTRUCTIONS

1. Brainstorm 50 different viral faceless video ideas related to theme "Little known history facts about [famous person]".

2. Randomly select 1 of the ideas. Research relevant statistics, dates, and figures related to the specific idea.

3. Write a 15-second video script for a viral faceless video. Use 6th grade language, use active voice, and start with a hook that leaves viewers wanting to know the answer. Do NOT start with a greeting like "Hey there!".

4. Write a 2-sentence video caption, use 6th grade language, no emojis, and append 3 relevant hashtags to the end of the caption, including "#ai".

# OUTPUT FORMAT

In JSON format:

1. Output the script.
2. Output the caption.
```

* * *

## [hashtag](https://help.blotato.com/api/make.com/make-faceless-videos\#ai-image-and-video-models)    AI Image and Video Models

Note: This template uses the older `textToImageModel` / `imageToVideoModel` parameters. For new automations, use the CREATE VISUAL node instead, which supports pre-built templates for carousels, slideshows, and videos. See [Visual Templatesarrow-up-right](https://help.blotato.com/api/visuals) for details.

You can also customize the AI image and video models.

The template default AI image model is “recraft” which creates realistic-looking images. I also personally like the image model “flux-pro”.

The template default AI video model is “framepack” which is the cheapest option, so that you don’t accidentally burn lots of credits.

Go [here arrow-up-right](https://help.blotato.com/api/api-reference/create-video) to see the full list of AI models available.

[PreviousMake AI Clonechevron-left](https://help.blotato.com/api/make.com/make-ai-clone) [NextMake AI Social Media Systemchevron-right](https://help.blotato.com/api/make.com/make-ai-social-media-system)

Last updated 23 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Make AI Social Media System | Blotato Help
URL: https://help.blotato.com/api/make.com/make-ai-social-media-system

To connect Make.com with Blotato, I recommend importing this sample [Make blueprintarrow-up-right](https://drive.google.com/file/d/1ZefGr-5cWogaqjsbhozF7c_Riwz_sWfQ/view?usp=sharing&utm_source=www.sabrina.dev&utm_medium=referral&utm_campaign=i-built-an-ai-social-media-system).

This blueprint is an automated AI Social Media System that analyzes an article and creates text posts (Twitter, Threads), text and image posts (Linkedin, Facebook, Instagram), and AI avatar videos (Tiktok).

If you just want to learn how the Make modules call Blotato, check these modules:

- Setup Social Accounts

- Upload to Blotato

- Publish


Here's the Youtube tutorial and detailed walkthrough of the AI Social Media System:

I Built an AI Social Media System - YouTube

Tap to unmute

[I Built an AI Social Media System](https://www.youtube.com/watch?v=4FAHV19KwKQ) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=4FAHV19KwKQ)

This system uses AI to automate content creation and posting across platforms:

🔥 Monitors Google Sheets for new articles

🔥 Writes AI social media posts

🔥 Generates AI images

🔥 Generates AI avatar clone videos

🔥 Publish to social media using Blotato API

I included multiple different types of content generated (text, image, video), so that you can easily customize this AI system to fit your needs.

## [hashtag](https://help.blotato.com/api/make.com/make-ai-social-media-system\#import-make-blueprint)    Import Make Blueprint

1. Log into Make

2. Go to "Scenarios"‘

3. Click on "Create a new scenario"

4. Click on "Import Blueprint" (top-right corner)

5. Upload my prebuilt Make Blueprint


## [hashtag](https://help.blotato.com/api/make.com/make-ai-social-media-system\#workflow-overview)    Workflow Overview

Here’s how everything works:

1. Google Sheets - Watch Rows



   - Monitors a spreadsheet for new URLs.

   - Triggers the automation when new row is added.


2. HTTP Module - Fetch Content



   - Retrieves the article from the provided URL in the Google Sheet.


3. OpenAI - Extract Article



   - Extracts the text article from the raw HTML. This helps clean up the input for our AI writing prompts.


4. OpenAI - Create Content



   - Write posts for LinkedIn, Twitter, Threads, Facebook, Instagram.

   - Generate AI image prompt, then generate AI image with DALLE-3.

   - Write AI video script and caption for AI avatar video for Tiktok.


5. Blotato - Automated Posting



   - Publish content to social media platforms via Blotato API.


## [hashtag](https://help.blotato.com/api/make.com/make-ai-social-media-system\#setup-google-sheets)    Setup Google Sheets

My Google Sheet is super simple. I just drop in an article URL, and the entire automation runs. You can easily switch this to Airtable, Notion, Slack, etc. depending on your flow.

1. Make a new Google Sheet

2. Create a column with header `URL`

3. Connect the Google Sheet to [Makearrow-up-right](https://make.com/?utm_source=www.sabrina.dev&utm_medium=referral&utm_campaign=i-built-an-ai-social-media-system)



   - Select the correct spreadsheet ID and sheet name

   - Enable "Includes Headers"


## [hashtag](https://help.blotato.com/api/make.com/make-ai-social-media-system\#setup-blotato)    Setup Blotato

Next, you’ll need to setup your Blotato API Key and Account IDs:

- Login to [Blotato.comarrow-up-right](http://blotato.com/?utm_source=www.sabrina.dev&utm_medium=referral&utm_campaign=i-built-an-ai-social-media-system)

- Go to “Settings”

- Copy your API key and account IDs

- Paste them into the Make node “Setup Social Accounts”


## [hashtag](https://help.blotato.com/api/make.com/make-ai-social-media-system\#setup-heygen)    Setup Heygen

Check out my previous in-depth tutorials on setting up your [AI Clonearrow-up-right](https://www.sabrina.dev/p/your-100-automated-ai-clone-makes-talking-videos).

You’ll need to sign up for Heygen’s API plan, which is separate from their web app.

Within Make, select your Heygen avatar and voice.

## [hashtag](https://help.blotato.com/api/make.com/make-ai-social-media-system\#test-everything)    Test Everything

After setting up your accounts and connecting them in Make, run the scenario with a real article URL, so that you have sample data flowing through the system.

⚡️ You don’t need to change anything else to get the system working!

I also recommend testing one branch at a time.

Simply UNLINK the other branches, while you isolate testing one branch. When done, link all branches back to the main router.

⚠️ Common troubleshooting issues:

- If posts fail to publish, check your API key and Account IDs.

- If your Make variables appear transparent with a colored border, run the scenario once so you have data flowing in the system.

- If your avatar video is not generated, most likely you need to upgrade to a paid Heygen API plan OR increase the wait timeout.


## [hashtag](https://help.blotato.com/api/make.com/make-ai-social-media-system\#make-blueprint)    Make Blueprint

Once configured, this AI Social Media System will:

- Pull content from Google Sheets

- Use AI to write social media posts

- Use AI to generate images and avatar video

- Post automatically to all major platforms


[PreviousMake Faceless Videoschevron-left](https://help.blotato.com/api/make.com/make-faceless-videos) [NextMake Slideshows & Carouselschevron-right](https://help.blotato.com/api/make.com/make-slideshows-and-carousels)

Last updated 1 year ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Make Slideshows & Carousels | Blotato Help
URL: https://help.blotato.com/api/make.com/make-slideshows-and-carousels

This AI Agent Automates Slideshows and Carousels

![](https://substackcdn.com/image/youtube/w_728,c_limit/Ev3xBsldyBk)

[This AI Agent Automates Slideshows and Carousels](https://open.substack.com/pub/sabrinaramonov/p/this-ai-agent-automates-slideshows-and-carousels?utm_source=substack&utm_medium=web&utm_content=embedded-post)

Free n8n/Make templates to automate slideshows and carousels for Tiktok, Instagram, and 6 other social platforms

Free n8n/Make templates to automate slideshows and carousels for Tiktok, Instagram, and 6 other social platforms

[![](https://substackcdn.com/image/fetch/$s_!Fq8u!,w_40,h_40,c_fill,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7075ee19-32b3-46ad-bae8-532bf200a103_1080x1080.png)](https://substack.com/)

[Sabrina Ramonov 🍄](https://substack.com/@sabrinaramonov?utm_content=embedded-post)

[Sabrina Ramonov 🍄](https://open.substack.com/pub/sabrinaramonov?utm_source=substack&utm_campaign=embedded-post) [Subscribe](https://www.sabrina.dev/subscribe?utm_source=substack&utm_medium=web&utm_content=embedded-post)

* * *

[15](https://open.substack.com/pub/sabrinaramonov/p/this-ai-agent-automates-slideshows-and-carousels?utm_source=substack&submitLike=true&utm_medium=web&utm_content=embedded-post) [Reply](https://open.substack.com/pub/sabrinaramonov/p/this-ai-agent-automates-slideshows-and-carousels?utm_source=substack&comments=true&utm_medium=web&utm_content=embedded-post) [Share](https://open.substack.com/pub/sabrinaramonov/p/this-ai-agent-automates-slideshows-and-carousels?utm_source=substack&utm_medium=web&utm_content=embedded-post)

May 27, 2025

* * *

[![](https://substackcdn.com/image/fetch/$s_!3cab!,w_24,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack.com%2Ficon%2FSubstackIcon%3Fheight%3D24)Read on Substack](https://open.substack.com/pub/sabrinaramonov/p/this-ai-agent-automates-slideshows-and-carousels?utm_source=substack&utm_medium=web&utm_content=embedded-post)

This n8n AI Agent will AUTOMATE your Carousels and Slideshows 🍄 - YouTube

Tap to unmute

[This n8n AI Agent will AUTOMATE your Carousels and Slideshows 🍄](https://www.youtube.com/watch?v=Ev3xBsldyBk) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=Ev3xBsldyBk)

Here's the n8n template:

[Make templatearrow-up-right](https://drive.google.com/file/d/1cYqrbOeR9T7k44R--nvnZj8bLwuGFn4s/view?usp=sharing&utm_source=www.sabrina.dev&utm_medium=referral&utm_campaign=this-ai-agent-automates-slideshows-and-carousels)

[PreviousMake AI Social Media Systemchevron-left](https://help.blotato.com/api/make.com/make-ai-social-media-system) [NextFAQschevron-right](https://help.blotato.com/api/make.com/faqs)

Last updated 10 months ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# FAQs | Blotato Help
URL: https://help.blotato.com/api/make.com/faqs

## [hashtag](https://help.blotato.com/api/make.com/faqs\#how-do-i-use-the-source-modules-in-make.com)    How do I use the Source modules in Make.com?

The Source modules allow you to extract content from YouTube, TikTok, articles, PDFs, audio, or AI research queries.

### [hashtag](https://help.blotato.com/api/make.com/faqs\#create-source-module)    Create Source Module

1. Add a Blotato module

2. Select "Create Source"

3. Choose your source type:



   - **URL**: YouTube, TikTok, Article, PDF, or Audio URL (auto-detected)

   - **Text**: Raw text content

   - **AI Research**: Perplexity-powered web search query


4. Optionally add Custom Instructions to transform the extracted content

5. Run to get a source ID


### [hashtag](https://help.blotato.com/api/make.com/faqs\#get-source-module)    Get Source Module

1. Add a Blotato module after Create Source

2. Select "Get Source"

3. Pass the source ID from Create Source

4. Enable "Clean Transcript" to remove timestamps (recommended)

5. Run to retrieve the extracted content


### [hashtag](https://help.blotato.com/api/make.com/faqs\#scenario-pattern)    Scenario Pattern

Copy

```
[Create Source] --> [Sleep 5-10s] --> [Get Source] --> [Use Content]
```

Add a Sleep module between Create and Get because extraction is asynchronous.

### [hashtag](https://help.blotato.com/api/make.com/faqs\#example-youtube-to-visual-content)    Example: YouTube to Visual Content

1. Create Source with YouTube URL

2. Sleep 10 seconds

3. Get Source to retrieve transcript

4. Pass transcript to Blotato Create Visual to make carousels or videos

5. Publish to social platforms


* * *

## [hashtag](https://help.blotato.com/api/make.com/faqs\#troubleshooting-make.com-and-n8n-automations)    Troubleshooting Make.com and n8n Automations

**The most common errors I see are related to:**

- wrong API key or account IDs

- invalid JSON (e.g. wrongly formatted)

- invalid API request (e.g. wrong parameters)

- invalid file format (e.g. wrong video dimensions)

- you're on the free Creatomate plan and you need to upgrade to export correct video dimensions


Tip: Use the official Blotato Make module to avoid manually copying API keys and account IDs.

**Here's a step-by-step checklist to troubleshoot your Make.com automation:**

- Check your Blotato API key, Account IDs, and Page IDs are correct

- Check that the correct Account ID is connected and passed in every Publish API call

- If you are publishing to a Facebook Page or Linkedin Company Page, you must also pass the Page ID, in addition to Account ID.

- Check your "Failed" dashboard for additional context: [https://my.blotato.com/failedarrow-up-right](https://my.blotato.com/failed)

- Verify that the JSON data in the HTTP Request contains the right parameters:


1. Ask ChatGPT to check if your **JSON is valid**.

2. Check it again with JSON Validator: [https://jsonlint.comarrow-up-right](https://jsonlint.com/)

3. If your JSON is valid, ask ChatGPT to **compare your JSON to Blotato's API docs**. Use this prompt:


Copy

```
You are an expert in Blotato API: https://help.blotato.com/api/api-reference/publish-post

Check the following JSON is valid and conforms to the Blotato API:

<json>
PASTE_YOUR_JSON_REQUEST_HERE
</json>
```

* * *

## [hashtag](https://help.blotato.com/api/make.com/faqs\#issues-with-json-request-to-blotato-api)    Issues with JSON Request to Blotato API?

I recommend using ChatGPT to troubleshoot your JSON payload:

1. Ask ChatGPT to check if your **JSON is valid**.

2. Check it again with JSON Validator: [https://jsonlint.comarrow-up-right](https://jsonlint.com/)

3. If your JSON is valid, ask ChatGPT to **compare your JSON to Blotato's API docs**. Use this prompt:


Copy

```
You are an expert in Blotato API: https://help.blotato.com/api/api-reference/publish-post

Check the following JSON is valid and conforms to the Blotato API:

<json>
PASTE_YOUR_JSON_REQUEST_HERE
</json>
```

* * *

## [hashtag](https://help.blotato.com/api/make.com/faqs\#submitting-wrong-video-dimensions-to-api)    Submitting Wrong Video Dimensions to API?

I see a lot of errors related to uploading invalid video dimensions.

For example, if you're on the free Creatomate plan, you need to upgrade in order to export correct video dimensions.

As a sanity check, try uploading this video instead:

[https://database.blotato.io/storage/v1/object/public/public\_media/4ddd33eb-e811-4ab5-93e1-2cd0b7e8fb3f/videogen-4c61a730-7eb2-47e9-a3a3-524740a1b877.mp4arrow-up-right](https://database.blotato.io/storage/v1/object/public/public_media/4ddd33eb-e811-4ab5-93e1-2cd0b7e8fb3f/videogen-4c61a730-7eb2-47e9-a3a3-524740a1b877.mp4)

* * *

## [hashtag](https://help.blotato.com/api/make.com/faqs\#how-to-preserve-newlines-in-multi-paragraph-posts)    How to Preserve Newlines in Multi-Paragraph Posts?

To preserve newlines in posts with multiple paragraphs, use the prebuilt Make module "Transform to JSON" and feed in your text. Then, update your HTTP request module: change `text` to use the resulting JSON string.

![](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252FqEZcr31pNFa5U3z8Ntmg%252Fimage.png%3Falt%3Dmedia%26token%3D300281b8-708b-4d28-8ae9-f90c0eeaa389&width=768&dpr=3&quality=100&sign=dcdc14f0&sv=2)

![](https://help.blotato.com/~gitbook/image?url=https%3A%2F%2F2374509648-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FevfU9S4Nh53PiGflQLah%252Fuploads%252F9fbfd7hLhd92a7xhnsp5%252Fimage.png%3Falt%3Dmedia%26token%3De39eb4d3-4aa6-4b4e-95eb-2dc35e11215b&width=768&dpr=3&quality=100&sign=66486379&sv=2)

* * *

## [hashtag](https://help.blotato.com/api/make.com/faqs\#how-do-i-get-my-heygen-avatar-video-with-captions)    How do I get my Heygen avatar video with captions?

You'll need to change 2 steps:

1. In the CREATE HEYGEN VIDEO step, there is a setting to enable captions. Make sure it's turned on.

2. In the Blotato Publish step, pass the `video_url_caption` from the GET VIDEO step into the mediaUrls parameter. This will use the video version with captions.


Remember to test your workflow after making this change to make sure everything works as expected.

* * *

## [hashtag](https://help.blotato.com/api/make.com/faqs\#how-do-you-customize-text-styles-in-the-carousel-slideshow)    How do you customize text styles in the carousel/slideshow?

It's on my roadmap to add more customization options and templates for carousels/slideshows!

Right now, the only customization is the caption position (top, middle, bottom).

* * *

## [hashtag](https://help.blotato.com/api/make.com/faqs\#how-do-you-post-a-slideshow-or-carousel)    How do you post a slideshow or carousel?

Using the official Blotato node, it's now super easy to post a slideshow or carousel. In your publishing node, update the Media URLs parameter - give it a comma separated list of URLs to be posted as a slideshow/carousel.

* * *

## [hashtag](https://help.blotato.com/api/make.com/faqs\#im-using-an-older-template-with-texttoimagemodel-and-imagetovideomodel-parameters.-do-these-still-wo)    I'm using an older template with textToImageModel and imageToVideoModel parameters. Do these still work?

Those parameters belong to an outdated template format. Switch to the new CREATE VISUAL system instead:

1. Browse all available templates at [https://my.blotato.com/videos/newarrow-up-right](https://my.blotato.com/videos/new) to see how they look

2. In n8n or Make, add the Blotato CREATE VISUAL node and select a template

3. Start with a carousel template -- carousels render near-instantly, so you get a fast test run

4. Click Execute to generate the carousel

5. Open your [API Dashboardarrow-up-right](https://my.blotato.com/api-dashboard) to see the JSON payload for each template

6. Override your desired inputs one-by-one


If you were making AI story videos, use the template called "AI Video with AI Voice."

Full documentation for each template: [Visual Templatesarrow-up-right](https://help.blotato.com/api/visuals)

* * *

## [hashtag](https://help.blotato.com/api/make.com/faqs\#how-do-i-schedule-a-post-for-a-specific-time)    How do I schedule a post for a specific time?

Set the Scheduled Time field in the Publish module using ISO-8601 format with timezone.

Format: `YYYY-MM-DDTHH:MM:SSZ` (UTC) or `YYYY-MM-DDTHH:MM:SS+HH:MM` (with offset)

Examples:

- `2026-03-10T14:00:00Z` (2:00 PM UTC)

- `2026-03-10T09:00:00-05:00` (9:00 AM Eastern)


In Make.com expressions, use `formatDate()` to build the timestamp:

Copy

```
{{formatDate(now; "YYYY-MM-DDTHH:mm:ssZ")}}
```

Do not pass a date without timezone information. The API rejects timestamps without a timezone offset.

* * *

**Didn't find your answer?**

- [General FAQs](https://help.blotato.com/support/faqs)

- [API FAQsarrow-up-right](https://github.com/Blotato-Inc/help.blotato.com/blob/main/api/faqs.md)

- [n8n FAQs](https://help.blotato.com/api/n8n/faqs)


[PreviousMake Slideshows & Carouselschevron-left](https://help.blotato.com/api/make.com/make-slideshows-and-carousels) [NextClaude Codechevron-right](https://help.blotato.com/api/claude-code)

Last updated 9 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Claude Code | Blotato Help
URL: https://help.blotato.com/api/claude-code

Use Claude Code with Blotato to build AI-powered social media workflows from your terminal.

## [hashtag](https://help.blotato.com/api/claude-code\#tutorials)    Tutorials

### [hashtag](https://help.blotato.com/api/claude-code\#build-your-ai-personal-assistant-for-social-media-marketing)    Build Your AI Personal Assistant for Social Media Marketing

Learn how to use Claude Code to build your own AI social media manager. Set up Claude Code and use prompts to write content in your brand voice, generate visuals, and post to social media.

Claude Code Is Revolutionizing Marketing and Social Media - YouTube

Tap to unmute

[Claude Code Is Revolutionizing Marketing and Social Media](https://www.youtube.com/watch?v=XPl6IKDADkU) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=XPl6IKDADkU)

### [hashtag](https://help.blotato.com/api/claude-code\#the-ultimate-claude-code-tutorial)    The ULTIMATE Claude Code Tutorial

A full course from first-time setup to building a personalized AI Marketing Officer with skills, quality gate hooks, brand voice, and subagents.

CLAUDE CODE FULL COURSE 🤯 - YouTube

Tap to unmute

[CLAUDE CODE FULL COURSE 🤯](https://www.youtube.com/watch?v=fYX6hHC9FhQ) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=fYX6hHC9FhQ)

### [hashtag](https://help.blotato.com/api/claude-code\#the-ultimate-ai-coding-guide-for-developers)    The ULTIMATE AI Coding Guide for Developers

Step-by-step breakdown of AI coding with Claude Code, battle tested with an existing complex codebase. Includes CLAUDE.md rules file and a real feature implementation from scratch.

7 Months of Claude Code Lessons in 19 Minutes - YouTube

Tap to unmute

[7 Months of Claude Code Lessons in 19 Minutes](https://www.youtube.com/watch?v=SDiDkK0r-9c) [Sabrina Ramonov 🍄](https://www.youtube.com/channel/UCiGWNa6QK6CiKPvv5-YPv8g)

![thumbnail-image](https://yt3.ggpht.com/4xWBLiSBOwmuX6RA3cNVtjzNpR5Rxy0fsK4hjqGKujCuGegLMndIE2yo-co0OQMOzJ2THGXt=s68-c-k-c0x00ffffff-no-rj)

Sabrina Ramonov 🍄166K subscribers

[Watch on](https://www.youtube.com/watch?v=SDiDkK0r-9c)

## [hashtag](https://help.blotato.com/api/claude-code\#connect-blotato-mcp-server-to-claude-code)    Connect Blotato MCP Server to Claude Code

To use Blotato tools directly in Claude Code, add the Blotato MCP server:

Copy

```
claude mcp add blotato \
  --url https://mcp.blotato.com/mcp \
  --header "blotato-api-key: YOUR_API_KEY"
```

Replace `YOUR_API_KEY` with your Blotato API key from [Settings > APIarrow-up-right](https://my.blotato.com/settings/api).

For the full setup guide, see [MCP Server Setup](https://help.blotato.com/api/mcp/setup).

[PreviousFAQschevron-left](https://help.blotato.com/api/make.com/faqs) [NextMCP Serverchevron-right](https://help.blotato.com/api/mcp)

Last updated 1 month ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Tools Reference | Blotato Help
URL: https://help.blotato.com/api/mcp/tools

The Blotato MCP Server exposes 9 tools. Your AI tool calls these automatically based on your prompts.

## [hashtag](https://help.blotato.com/api/mcp/tools\#accounts)    Accounts

### [hashtag](https://help.blotato.com/api/mcp/tools\#blotato_get_user)    blotato\_get\_user

Get your account info and verify the connection is working.

- **Input**: none

- **Output**: user ID, email, subscription status


### [hashtag](https://help.blotato.com/api/mcp/tools\#blotato_list_accounts)    blotato\_list\_accounts

List all connected social media accounts with subaccounts (for Facebook Pages and LinkedIn Company Pages).

- **Input**: `platform` (optional) - filter by platform name

- **Output**: array of accounts with ID, platform, name, username, and subaccounts


* * *

## [hashtag](https://help.blotato.com/api/mcp/tools\#publishing)    Publishing

### [hashtag](https://help.blotato.com/api/mcp/tools\#blotato_create_post)    blotato\_create\_post

Create and publish (or schedule) a post to a social media platform.

- **Input**:



  - `accountId` (required) - from blotato\_list\_accounts

  - `platform` (required) - twitter, instagram, facebook, tiktok, linkedin, pinterest, bluesky, threads, or youtube

  - `text` (required) - post content

  - `mediaUrls` (optional) - array of public media URLs

  - `scheduledTime` (optional) - ISO 8601 datetime

  - `useNextFreeSlot` (optional) - use next available schedule slot

  - `pageId` (optional) - for Facebook/LinkedIn pages

  - `mediaType` (optional) - for Instagram: image, video, reel, or carousel

  - `privacyLevel` (optional) - for TikTok

  - `additionalPosts` (optional) - array of additional posts for threads (Twitter, Bluesky, Threads). Each entry has `text` and `mediaUrls`. The first post uses the top-level `text` and `mediaUrls` fields. Blotato handles reply chaining.

  - `boardId` (optional) - for Pinterest

  - `title` (optional) - for Pinterest or YouTube

  - `privacyStatus` (optional) - for YouTube: public, private, or unlisted


- **Output**: postSubmissionId (poll with blotato\_get\_post\_status)


### [hashtag](https://help.blotato.com/api/mcp/tools\#blotato_get_post_status)    blotato\_get\_post\_status

Check the status of a submitted post.

- **Input**: `postSubmissionId` (required)

- **Output**: status, publicUrl (when published), errorMessage (when failed)

- **Status values**: in-progress -> published \| scheduled \| failed


* * *

## [hashtag](https://help.blotato.com/api/mcp/tools\#content-extraction)    Content Extraction

### [hashtag](https://help.blotato.com/api/mcp/tools\#blotato_extract_content)    blotato\_extract\_content

Extract content from a URL or text. Polls internally and returns the result directly.

- **Input**:



  - `sourceType` (required) - youtube, article, twitter, tiktok, text, audio, pdf, or perplexity-query

  - `url` (optional) - required for URL-based source types

  - `text` (optional) - required for text and perplexity-query source types

  - `customInstructions` (optional)


- **Output**: title and content (extracted text)


* * *

## [hashtag](https://help.blotato.com/api/mcp/tools\#videos-and-images)    Videos and Images

### [hashtag](https://help.blotato.com/api/mcp/tools\#blotato_list_templates)    blotato\_list\_templates

List all available visual templates (videos, carousels, quote cards, infographics).

- **Input**: none

- **Output**: array of templates with ID, name, and description


### [hashtag](https://help.blotato.com/api/mcp/tools\#blotato_create_visual)    blotato\_create\_visual

Generate an image, carousel, or video from a template.

- **Input**:



  - `templateId` (required) - from blotato\_list\_templates

  - `prompt` (optional) - describe what you want in natural language

  - `render` (optional, default: true)


- **Output**: visual ID and status (poll with blotato\_get\_visual\_status)


### [hashtag](https://help.blotato.com/api/mcp/tools\#blotato_get_visual_status)    blotato\_get\_visual\_status

Check the status of a visual generation request.

- **Input**: `id` (required)

- **Output**: status, mediaUrl (for videos), imageUrls (for images/carousels)

- **Status values**: queueing -> generating-script -> script-ready -> generating-media -> media-ready -> exporting -> done \| failed


* * *

## [hashtag](https://help.blotato.com/api/mcp/tools\#media)    Media

### [hashtag](https://help.blotato.com/api/mcp/tools\#blotato_upload_media)    blotato\_upload\_media

Upload media from a public URL to Blotato's servers. Returns a Blotato-hosted URL for use in blotato\_create\_post.

- **Input**: `url` (required) - public URL of the media file

- **Output**: hosted URL and media ID


[PreviousSetup Guidechevron-left](https://help.blotato.com/api/mcp/setup) [NextExample Promptschevron-right](https://help.blotato.com/api/mcp/examples)

Last updated 1 month ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Example Prompts | Blotato Help
URL: https://help.blotato.com/api/mcp/examples

The Blotato MCP Server translates your natural language prompts into the right sequence of API calls. Here are common prompts and how they work behind the scenes.

## [hashtag](https://help.blotato.com/api/mcp/examples\#prompt-to-tool-mapping)    Prompt-to-Tool Mapping

What You Say

Tools Called

How It Works

"Post 'Hello world' to my Twitter"

`blotato_list_accounts` -\> `blotato_create_post`

2 calls. Finds your Twitter account ID, creates and publishes the post. Returns the published URL.

"Schedule a LinkedIn post for Friday at 3pm"

`blotato_list_accounts` -\> `blotato_create_post`

2 calls. Finds your LinkedIn account, creates the post with scheduledTime. Confirms the scheduled time.

"Summarize this YouTube video and post it to Instagram"

`blotato_extract_content` -\> `blotato_list_accounts` -\> `blotato_create_post`

3 calls. Extracts the video transcript, rewrites it for Instagram, then publishes with the right media type.

"What accounts do I have connected?"

`blotato_list_accounts`

1 call. Returns all connected accounts with subaccounts and platform details.

"Create an infographic about 5 AI trends"

`blotato_list_templates` -\> `blotato_create_visual`

2 calls. Picks a suitable template, passes your prompt. AI fills in the content and layout.

"Make a carousel of motivational quotes"

`blotato_list_templates` -\> `blotato_create_visual` -\> `blotato_get_visual_status`

2-3 calls. Picks a carousel template, generates the visual. Polls for completion if needed.

"Generate a product showcase image for my new sneakers"

`blotato_list_templates` -\> `blotato_create_visual`

2 calls. Picks a template, passes your prompt with product details. Template AI handles layout and styling.

"Create a short video about my coffee brand and post it to TikTok"

`blotato_list_templates` -\> `blotato_create_visual` -\> `blotato_get_visual_status` -\> `blotato_list_accounts` -\> `blotato_create_post`

4-5 calls. Full pipeline: pick video template -> generate video -> poll until done -> find TikTok account -> publish with the video URL.

"I want to make a quote card image"

`blotato_list_templates` -\> `blotato_create_visual`

2 calls. Picks a quote card template, generates the image. Returns image URLs usable in a follow-up post.

"Check on my visual I created earlier"

`blotato_get_visual_status`

1 call. Checks the status of a previous visual generation using its ID.

"Analyze this article and turn it into a thread"

`blotato_extract_content` -\> `blotato_list_accounts` -\> `blotato_create_post`

3 calls. Extracts the article content, splits it into thread segments, publishes as one thread using additionalPosts\[\].

"Post this update to my Sunrise Bakery Facebook page"

`blotato_list_accounts` -\> `blotato_create_post`

2 calls. Lists all accounts and subaccounts, matches "Sunrise Bakery" Facebook page, publishes with the correct pageId.

* * *

## [hashtag](https://help.blotato.com/api/mcp/examples\#multi-step-workflows)    Multi-Step Workflows

### [hashtag](https://help.blotato.com/api/mcp/examples\#repurpose-a-youtube-video-to-multiple-platforms)    Repurpose a YouTube Video to Multiple Platforms

> "Take this YouTube video \[URL\], summarize it, create a carousel, and post it to Instagram and LinkedIn"

1. `blotato_extract_content` \- extracts the video transcript

2. `blotato_list_templates` \- finds carousel templates

3. `blotato_create_visual` \- generates the carousel from the summary

4. `blotato_get_visual_status` \- waits for the carousel to finish

5. `blotato_list_accounts` \- finds your Instagram and LinkedIn accounts

6. `blotato_create_post` (x2) - posts to both platforms


### [hashtag](https://help.blotato.com/api/mcp/examples\#schedule-a-week-of-content)    Schedule a Week of Content

> "Create 5 different quote cards and schedule them to my Twitter, one per day starting Monday"

1. `blotato_list_templates` \- finds quote card templates

2. `blotato_create_visual` (x5) - generates 5 quote cards with different prompts

3. `blotato_get_visual_status` (x5) - waits for each to finish

4. `blotato_list_accounts` \- finds your Twitter account

5. `blotato_create_post` (x5) - schedules each with a different scheduledTime


### [hashtag](https://help.blotato.com/api/mcp/examples\#research-and-publish)    Research and Publish

> "Research the latest AI trends and create a thread about it on Twitter"

1. `blotato_extract_content` \- uses perplexity-query to research the topic

2. `blotato_list_accounts` \- finds your Twitter account

3. `blotato_create_post` \- publishes as a thread using additionalPosts\[\] for the additional tweets


[PreviousTools Referencechevron-left](https://help.blotato.com/api/mcp/tools) [NextFAQschevron-right](https://help.blotato.com/api/mcp/faqs)

Last updated 23 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# FAQs | Blotato Help
URL: https://help.blotato.com/api/mcp/faqs

## [hashtag](https://help.blotato.com/api/mcp/faqs\#do-i-need-to-install-anything)    Do I need to install anything?

No. The Blotato MCP Server runs remotely. Add the server URL and API key to your AI tool's configuration and you're ready to go.

* * *

## [hashtag](https://help.blotato.com/api/mcp/faqs\#which-ai-tools-are-supported)    Which AI tools are supported?

The MCP Server works with any MCP-compatible AI host, including:

- Claude Desktop

- Claude Code

- Claude Cowork (add Blotato as a custom connector via Menu > Developer > App Config File)

- Cursor


Any tool supporting the MCP protocol with remote HTTP servers works with Blotato. The setup is the same across all tools: add the Blotato MCP server URL and your API key to your tool's MCP configuration.

* * *

## [hashtag](https://help.blotato.com/api/mcp/faqs\#do-i-need-a-paid-blotato-subscription)    Do I need a paid Blotato subscription?

Yes. API access (including MCP) requires a paid subscription. This keeps the platform in good standing with social media platforms by reducing spam.

* * *

## [hashtag](https://help.blotato.com/api/mcp/faqs\#is-this-different-from-the-rest-api)    Is this different from the REST API?

The MCP Server wraps the same Blotato API into 9 AI-friendly tools. Your AI host calls these tools automatically based on your prompts. You get the same functionality as the REST API without writing code.

* * *

## [hashtag](https://help.blotato.com/api/mcp/faqs\#how-does-authentication-work)    How does authentication work?

The MCP Server uses the same `blotato-api-key` header as the REST API. Get your API key from [Settings > APIarrow-up-right](https://my.blotato.com/settings/api).

* * *

## [hashtag](https://help.blotato.com/api/mcp/faqs\#do-i-need-to-know-which-tools-to-call)    Do I need to know which tools to call?

No. Your AI tool reads the tool descriptions and picks the right ones based on your prompt. Say what you want in natural language and the AI figures out the right sequence of calls.

* * *

## [hashtag](https://help.blotato.com/api/mcp/faqs\#what-happens-if-a-tool-call-fails)    What happens if a tool call fails?

The AI tool receives an error message and decides how to proceed. Common errors include:

- Invalid API key - check your config

- Rate limit exceeded - wait and retry

- Account not found - connect your account in [Settingsarrow-up-right](https://my.blotato.com/settings)


* * *

## [hashtag](https://help.blotato.com/api/mcp/faqs\#how-do-i-create-and-publish-visuals-videos-carousels-images)    How do I create and publish visuals (videos, carousels, images)?

Tell your AI tool what you want to create. For example: "Make a carousel about productivity tips and post it to Instagram." The AI tool:

1. Picks a template from your available templates

2. Generates the visual using your prompt

3. Waits for the visual to finish rendering

4. Posts it to the platform you specified


* * *

## [hashtag](https://help.blotato.com/api/mcp/faqs\#where-do-i-get-my-account-ids)    Where do I get my account IDs?

You do not need account IDs when using the MCP Server. The AI tool calls `blotato_list_accounts` to find the right account based on your prompt. For example, if you say "post to my Twitter," the tool looks up your Twitter account automatically.

* * *

## [hashtag](https://help.blotato.com/api/mcp/faqs\#how-do-i-post-to-a-specific-facebook-or-linkedin-page)    How do I post to a specific Facebook or LinkedIn page?

Tell your AI tool which page you want to post to by name. For example:

- "Post this to my Business Page on Facebook"

- "Schedule this to my company's LinkedIn page"


The AI tool calls `blotato_list_accounts` behind the scenes, finds all your connected pages, and picks the one matching your description. You do not need to look up or pass any page IDs.

If you have multiple pages with similar names, be specific: "Post to my Facebook page called Sunrise Bakery."

* * *

**Didn't find your answer?**

- [General FAQs](https://help.blotato.com/support/faqs)

- [API FAQsarrow-up-right](https://github.com/Blotato-Inc/help.blotato.com/blob/main/api/faqs.md)

- [n8n FAQs](https://help.blotato.com/api/n8n/faqs)

- [Make.com FAQs](https://help.blotato.com/api/make.com/faqs)


[PreviousExample Promptschevron-left](https://help.blotato.com/api/mcp/examples) [NextOpenAPI Referencechevron-right](https://help.blotato.com/api/openapi-reference)

Last updated 9 days ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# OpenAPI Reference | Blotato Help
URL: https://help.blotato.com/api/openapi-reference

[Publishingchevron-right](https://help.blotato.com/api/openapi-reference/publishing) [Accountschevron-right](https://help.blotato.com/api/openapi-reference/accounts) [Videochevron-right](https://help.blotato.com/api/openapi-reference/video)

[PreviousFAQschevron-left](https://help.blotato.com/api/mcp/faqs) [NextPublishingchevron-right](https://help.blotato.com/api/openapi-reference/publishing)

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Publishing | Blotato Help
URL: https://help.blotato.com/api/openapi-reference/publishing

Endpoints related to publishing content, such as posts and drafts.

### [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#post-v2-media)    Upload media from URL

post

https://backend.blotato.com/v2/media

## [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#)    General

This endpoint allows users to upload media by providing a URL. The uploaded media will be processed and stored, returning a new media URL that is used to publish a new post. Most of the platforms require validated URLs for posting images.

You can upload:

- publicly accessible URLs

- _base64_ encoded image data


Media uploads are limited to 1GB file size or smaller.

Media upload has a user-level rate limit of **10 requests / minute**.

## [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#)    Upload Google Drive

If you have a link in google drive like this:

[https://drive.google.com/file/d/18-UgDEaKG7YR7AewIDd\_Qi4QCLCX5Kop/view?usp=drivesdkarrow-up-right](https://drive.google.com/file/d/18-UgDEaKG7YR7AewIDd_Qi4QCLCX5Kop/view?usp=drivesdk)

You can use the following link for your Blotato "upload media" API call:

[https://drive.google.com/uc?export=download&id=18-UgDEaKG7YR7AewIDd\_Qi4QCLCX5Koparrow-up-right](https://drive.google.com/uc?export=download&id=18-UgDEaKG7YR7AewIDd_Qi4QCLCX5Kop)

Note how the IDs match: `18-UgDEaKG7YR7AewIDd_Qi4QCLCX5Kop`

To see examples of how to upload to Blotato from a Google Drive, you can also check out these tutorials and templates:

n8n: [https://youtu.be/D9okDd\_1tBIarrow-up-right](https://youtu.be/D9okDd_1tBI)

make: [https://youtu.be/f4Stdm4lDNMarrow-up-right](https://youtu.be/f4Stdm4lDNM)

## [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#)    Seeing error "Google Drive can't scan this file for viruses"?

This is the **most common issue** when using Google Drive. When you try to access your file, you see this popup "Google Drive can't scan this file for viruses".

The issue is when you host a large video on google drive, it will show this popup, which prevents Blotato from accessing the video.

Recommended workaround: if you're regularly posting large videos (100MB+), I recommend using frame.io, an AWS S3 bucket, or similar tool where there is no issue passing around large video files.

Authorizations

apiKeychevron-down

apiKey

blotato-api-keystringRequired

Body

application/jsonchevron-down

application/json

urlstringRequired

The URL of the media to upload.

Example: `https://example.com/image.jpg`

Responses

chevron-right

201

Default Response

application/json

urlstringRequired

Uploaded and validated blotato media URL.

Example: `https://database.blotato.io/media/12345.jpg`

idstringRequired

The internal ID of the uploaded media.

Example: `media_12345`

chevron-right

422

Validation error

application/json

chevron-right

429

Rate limit exceeded

application/json

chevron-right

500

Server error

application/json

post

/v2/media

HTTPchevron-down

HTTPcURLJavaScriptPython

Copy

```
POST /v2/media HTTP/1.1
Host: backend.blotato.com
blotato-api-key: YOUR_API_KEY
Content-Type: application/json
Accept: */*
Content-Length: 39

{
  "url": "https://example.com/image.jpg"
}
```

Test it

201

Default Response

chevron-down

Copy

```
{
  "url": "https://database.blotato.io/media/12345.jpg",
  "id": "media_12345"
}
```

### [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#post-v2-posts)    Create a new post

post

https://backend.blotato.com/v2/posts

## [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#)    General

Creates a new post with the provided content and optional scheduling. The post can be published immediately or scheduled for a later time.

Every post is scheduled on a queue. Failed posts are available at [https://my.blotato.com/failedarrow-up-right](https://my.blotato.com/failed). The most common issue of failed post is incorrect JSON structure. Please make sure that JSON payload conforms to the structure described above. If you are still having trouble with identifying the issue, please contact support via Intercom and provide your `postSubmissionId`.

Post creation has a user-level rate limit of **30 requests / minute** to prevent spamming / abusing social media endpoints

## [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#)    Examples

### [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#)    Post to a Platform Immediately

Copy

```
POST https://backend.blotato.com/v2/posts HTTP/1.1
Content-Type: application/json
Headers:

{
  "post": {
    "accountId": "acc_12345",
    "content": {
      "text": "Hello, world!",
      "mediaUrls": [],
      "platform": "twitter"
    },
    "target": {
      "targetType": "twitter"
    }
  }
}
```

### [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#)    Post at a Scheduled Time

Copy

```
POST https://backend.blotato.com/v2/posts HTTP/1.1
Content-Type: application/json

{
  "post": {
    "accountId": "acc_67890",
    "content": {
      "text": "Scheduled post example",
      "mediaUrls": [],
      "platform": "facebook"
    },
    "target": {
      "targetType": "facebook",
      "pageId": "987654321"
    }
  },
  "scheduledTime": "2025-03-10T15:30:00Z"
}
```

### [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#)    Post an Image or a Video

Copy

```
POST https://backend.blotato.com/v2/posts HTTP/1.1
Content-Type: application/json

{
  "post": {
    "accountId": "acc_24680",
    "content": {
      "text": "Check out this image!",
      "mediaUrls": [\
        "https://example.com/image1.jpg",\
        "https://example.com/image2.jpg"\
      ],
      "platform": "instagram"
    },
    "target": {
      "targetType": "instagram"
    }
  }
}
```

### [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#)    Post a Twitter-like Thread with Multiple Posts

Copy

```
POST https://backend.blotato.com/v2/posts HTTP/1.1
Content-Type: application/json
Headers:

POST https://backend.blotato.com/v2/posts HTTP/1.1
Content-Type: application/json

{
  "post": {
    "accountId": "acc_13579",
    "content": {
      "text": "This is the first tweet in the thread.",
      "mediaUrls": [],
      "platform": "twitter",
      "additionalPosts": [\
        {\
          "text": "Here's the second tweet, adding more info.",\
          "mediaUrls": []\
        },\
        {\
          "text": "And here's the third tweet to conclude!",\
          "mediaUrls": []\
        }\
      ]
    },
    "target": {
      "targetType": "twitter"
    }
  }
}
```

Authorizations

apiKeychevron-down

apiKey

blotato-api-keystringRequired

Body

application/jsonchevron-down

application/json

postobjectRequired

Show propertiesplus

postDraftIdstringOptional

The ID of the existing post draft to use for creating the post. Unused in the API call

Example: `12345`

useNextFreeSlotbooleanOptional

If provided, indicates whether to use the next available free slot for scheduling the post. If set to true, the post will be scheduled at the next available slot time for the specified platform. If neither `scheduledTime` nor `slot` is provided, and this is set to true, the post will be scheduled at the next available slot time.

slotobjectOptional

The schedule slot to use for scheduling the post. If neither `scheduledTime` nor `slot` is provided, the post will be published immediately.

Show propertiesplus

scheduledTimestringOptional

The timestamp (ISO 8601) when the post should be published.

Example: `2026-04-04T15:43:56.774Z`

Responses

chevron-right

201

Submitted

application/json

Submitted

postSubmissionIdstringRequired

The ID of the post submission. Use this ID to track the status of the post.

Example: `123e4567-e89b-12d3-a456-426614174000`

chevron-right

422

Validation error

application/json

chevron-right

429

Rate limit exceeded

application/json

chevron-right

500

Server error

application/json

post

/v2/posts

HTTPchevron-down

HTTPcURLJavaScriptPython

Copy

```
POST /v2/posts HTTP/1.1
Host: backend.blotato.com
blotato-api-key: YOUR_API_KEY
Content-Type: application/json
Accept: */*
Content-Length: 328

{
  "post": {
    "target": {
      "targetType": "tiktok",
      "isYourBrand": false,
      "autoAddMusic": false,
      "disabledDuet": false,
      "privacyLevel": "SELF_ONLY",
      "isAiGenerated": false,
      "disabledStitch": false,
      "disabledComments": false,
      "isBrandedContent": false
    },
    "content": {
      "text": "Hello, blotato!",
      "mediaUrls": [\
        "https://database.blotato.io/some-media-path.mp4"\
      ]
    }
  }
}
```

Test it

201

Submitted

chevron-down

Copy

```
{
  "postSubmissionId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#get-v2-posts-postsubmissionid)    Get post status

get

https://backend.blotato.com/v2/posts/{postSubmissionId}

Fetches the status of a post by its submission ID. This is useful for checking if a post was successfully published or if it failed. Post lookup has a user-level rate limit of **60 requests / minute** to prevent spamming / abusing social media endpoints

Authorizations

apiKeychevron-down

apiKey

blotato-api-keystringRequired

Path parameters

postSubmissionIdstringRequired

The ID of the post submission to check.

Example: `123e4567-e89b-12d3-a456-426614174000`

Responses

chevron-right

200

Default Response

application/json

chevron-right

404

Not found

application/json

chevron-right

429

Rate limit exceeded

application/json

chevron-right

500

Server error

application/json

get

/v2/posts/{postSubmissionId}

HTTPchevron-down

HTTPcURLJavaScriptPython

Copy

```
GET /v2/posts/{postSubmissionId} HTTP/1.1
Host: backend.blotato.com
blotato-api-key: YOUR_API_KEY
Accept: */*
```

Test it

200

Default Response

chevron-down

Copy

```
{
  "postSubmissionId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "published",
  "scheduledTime": "2025-03-11T15:30:00.000Z",
  "publicUrl": "https://x.com/post/12345",
  "errorMessage": "Unsupported media type"
}
```

### [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#get-v2-schedules)    List scheduled posts

get

https://backend.blotato.com/v2/schedules

Fetches the current user's scheduled posts, ordered by scheduled time (ascending). Supports cursor-based pagination. Only returns posts scheduled in the future.

Authorizations

apiKeychevron-down

apiKey

blotato-api-keystringRequired

Query parameters

limitintegerOptional

cursorstringOptional

Responses

chevron-right

200

Default Response

application/json

chevron-right

500

Default Response

application/json

get

/v2/schedules

HTTPchevron-down

HTTPcURLJavaScriptPython

Copy

```
GET /v2/schedules HTTP/1.1
Host: backend.blotato.com
blotato-api-key: YOUR_API_KEY
Accept: */*
```

Test it

200

Default Response

chevron-down

Copy

```
{
  "items": [\
    {\
      "id": "text",\
      "account": {\
        "id": "text",\
        "name": "text",\
        "username": "text",\
        "profileImageUrl": "text",\
        "subaccountId": "text",\
        "subId": "text",\
        "subaccountName": "text"\
      },\
      "draft": {\
        "accountId": "1",\
        "content": {\
          "text": "My text",\
          "mediaUrls": [\
            "https://database.blotato.io/some-image-path.jpg"\
          ],\
          "platform": "twitter",\
          "additionalPosts": [\
            {\
              "text": "My text",\
              "mediaUrls": [\
                "https://database.blotato.io/some-image-path.jpg"\
              ]\
            }\
          ]\
        },\
        "target": {\
          "targetType": "webhook",\
          "url": "https://example.com/webhook"\
        }\
      },\
      "scheduledAt": "text"\
    }\
  ],
  "count": "text",
  "cursor": "text"
}
```

### [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#get-v2-schedules-id)    Get a scheduled post by ID

get

https://backend.blotato.com/v2/schedules/{id}

Fetches a single scheduled post by its ID. Returns the schedule details including the draft content and account information.

Authorizations

apiKeychevron-down

apiKey

blotato-api-keystringRequired

Path parameters

idstringRequired

Responses

chevron-right

200

Default Response

application/json

chevron-right

404

Not found

application/json

chevron-right

500

Server error

application/json

get

/v2/schedules/{id}

HTTPchevron-down

HTTPcURLJavaScriptPython

Copy

```
GET /v2/schedules/{id} HTTP/1.1
Host: backend.blotato.com
blotato-api-key: YOUR_API_KEY
Accept: */*
```

Test it

200

Default Response

chevron-down

Copy

```
{
  "schedule": {
    "id": "text",
    "account": {
      "id": "text",
      "name": "text",
      "username": "text",
      "profileImageUrl": "text",
      "subaccountId": "text",
      "subId": "text",
      "subaccountName": "text"
    },
    "draft": {
      "accountId": "1",
      "content": {
        "text": "My text",
        "mediaUrls": [\
          "https://database.blotato.io/some-image-path.jpg"\
        ],
        "platform": "twitter",
        "additionalPosts": [\
          {\
            "text": "My text",\
            "mediaUrls": [\
              "https://database.blotato.io/some-image-path.jpg"\
            ]\
          }\
        ]
      },
      "target": {
        "targetType": "webhook",
        "url": "https://example.com/webhook"
      }
    },
    "scheduledAt": "text"
  }
}
```

### [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#delete-v2-schedules-id)    Delete a scheduled post

delete

https://backend.blotato.com/v2/schedules/{id}

Deletes a scheduled post by its ID. The associated publishing job is also cancelled.

Authorizations

apiKeychevron-down

apiKey

blotato-api-keystringRequired

Path parameters

idstringRequired

The ID of the schedule to delete.

Responses

chevron-right

204

Default Response

application/json

chevron-right

500

Default Response

application/json

delete

/v2/schedules/{id}

HTTPchevron-down

HTTPcURLJavaScriptPython

Copy

```
DELETE /v2/schedules/{id} HTTP/1.1
Host: backend.blotato.com
blotato-api-key: YOUR_API_KEY
Accept: */*
```

Test it

204

Default Response

chevron-down

Copy

```
{}
```

### [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#patch-v2-schedules-id)    Updates a scheduled post. The post must be in scheduled state to be updated. You can update the scheduled time or change the post contents.

patch

https://backend.blotato.com/v2/schedules/{id}

Updates a scheduled post by ID. You can update the draft content, the scheduled time, or both. The scheduled time must be a valid ISO 8601 date in the future. When the scheduled time is changed, the post is re-queued for publishing at the new time.

Authorizations

apiKeychevron-down

apiKey

blotato-api-keystringRequired

Path parameters

idstringRequired

The ID of the schedule to update.

Body

application/jsonchevron-down

application/json

patchobjectRequired

The fields to update in the schedule.

Show propertiesplus

Responses

chevron-right

204

Default Response

application/json

chevron-right

404

Not found

application/json

chevron-right

422

Validation error

application/json

chevron-right

500

Default Response

application/json

patch

/v2/schedules/{id}

HTTPchevron-down

HTTPcURLJavaScriptPython

Copy

```
PATCH /v2/schedules/{id} HTTP/1.1
Host: backend.blotato.com
blotato-api-key: YOUR_API_KEY
Content-Type: application/json
Accept: */*
Content-Length: 347

{
  "patch": {
    "draft": {
      "accountId": "1",
      "content": {
        "text": "My text",
        "mediaUrls": [\
          "https://database.blotato.io/some-image-path.jpg"\
        ],
        "platform": "twitter",
        "additionalPosts": [\
          {\
            "text": "My text",\
            "mediaUrls": [\
              "https://database.blotato.io/some-image-path.jpg"\
            ]\
          }\
        ]
      },
      "target": {
        "targetType": "webhook",
        "url": "https://example.com/webhook"
      }
    },
    "scheduledTime": "text"
  }
}
```

Test it

204

Default Response

chevron-down

Copy

```
{}
```

### [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#post-v2-source-resolutions-v3)    Resolves a source asynchronously

post

https://backend.blotato.com/v2/source-resolutions-v3

Submits a source for asynchronous resolution. The response contains a source resolution ID that can be used to check the status of the resolution. A source can be any text content, URL, or other data that needs to be processed to generate a title and content. Source resolution has a user-level rate limit of **30 requests / minute**.

Authorizations

apiKeychevron-down

apiKey

blotato-api-keystringRequired

Body

application/jsonchevron-down

application/json

sourceone ofRequired

objectOptional

Show propertiesplus

or

objectOptional

Show propertiesplus

or

objectOptional

Show propertiesplus

or

objectOptional

Show propertiesplus

or

objectOptional

Show propertiesplus

or

objectOptional

Show propertiesplus

or

objectOptional

Show propertiesplus

or

objectOptional

Show propertiesplus

customInstructionsstringOptional

Responses

chevron-right

201

Default Response

application/json

idstringRequired

chevron-right

422

Validation error

application/json

chevron-right

500

Default Response

application/json

post

/v2/source-resolutions-v3

HTTPchevron-down

HTTPcURLJavaScriptPython

Copy

```
POST /v2/source-resolutions-v3 HTTP/1.1
Host: backend.blotato.com
blotato-api-key: YOUR_API_KEY
Content-Type: application/json
Accept: */*
Content-Length: 74

{
  "source": {
    "sourceType": "text",
    "text": "text"
  },
  "customInstructions": "text"
}
```

Test it

201

Default Response

chevron-down

Copy

```
{
  "id": "text"
}
```

### [hashtag](https://help.blotato.com/api/openapi-reference/publishing\#get-v2-source-resolutions-v3-id)    Get source resolution status

get

https://backend.blotato.com/v2/source-resolutions-v3/{id}

Fetches the status of a source resolution by its ID. This endpoint allows users to check whether the source has been resolved or is still in the queue. Source resolution lookup has a user-level rate limit of **60 requests / minute**.

Authorizations

apiKeychevron-down

apiKey

blotato-api-keystringRequired

Path parameters

idstringRequired

Responses

chevron-right

200

Default Response

application/json

chevron-right

404

Not found

application/json

chevron-right

500

Default Response

application/json

get

/v2/source-resolutions-v3/{id}

HTTPchevron-down

HTTPcURLJavaScriptPython

Copy

```
GET /v2/source-resolutions-v3/{id} HTTP/1.1
Host: backend.blotato.com
blotato-api-key: YOUR_API_KEY
Accept: */*
```

Test it

200

Default Response

chevron-down

Copy

```
{
  "id": "text",
  "status": "completed",
  "title": "text",
  "content": "text",
  "referenceUrl": "text"
}
```

[PreviousOpenAPI Referencechevron-left](https://help.blotato.com/api/openapi-reference) [NextAccountschevron-right](https://help.blotato.com/api/openapi-reference/accounts)

Last updated 2 minutes ago

---

# Accounts | Blotato Help
URL: https://help.blotato.com/api/openapi-reference/accounts

Endpoints related to user accounts and social media accounts.

### [hashtag](https://help.blotato.com/api/openapi-reference/accounts\#get-v2-users-me)    Get current user information

get

https://backend.blotato.com/v2/users/me

Fetches the current user's information, including subscription status and API key if available.

Authorizations

apiKeychevron-down

apiKey

blotato-api-keystringRequired

Responses

chevron-right

200

Current user information

application/json

Current user information

idstringRequired

subscriptionStatusstring · nullableRequired

apiKeystring · nullableRequired

chevron-right

401

Unauthorized

application/json

get

/v2/users/me

HTTPchevron-down

HTTPcURLJavaScriptPython

Copy

```
GET /v2/users/me HTTP/1.1
Host: backend.blotato.com
blotato-api-key: YOUR_API_KEY
Accept: */*
```

Test it

200

Current user information

chevron-down

Copy

```
{
  "id": "user_12345",
  "subscriptionStatus": "active",
  "apiKey": "your-api-key"
}
```

### [hashtag](https://help.blotato.com/api/openapi-reference/accounts\#get-v2-users-me-accounts)    Get current user accounts

get

https://backend.blotato.com/v2/users/me/accounts

Fetches the current user's social media accounts. Optionally filter by platform.

Authorizations

apiKeychevron-down

apiKey

blotato-api-keystringRequired

Query parameters

platformstring · enumOptional

Social media platform

Example: `twitter`Possible values:`twitter``instagram``linkedin``facebook``tiktok``pinterest``threads``bluesky``youtube``other`

Responses

chevron-right

200

Default Response

application/json

itemsobject\[\]Required

List of social media accounts

Example: `[{"id":"12345","platform":"twitter","fullname":"John Doe","username":"@johndoe"}]`

Show propertiesplus

chevron-right

401

Unauthorized

application/json

chevron-right

500

Server error

application/json

get

/v2/users/me/accounts

HTTPchevron-down

HTTPcURLJavaScriptPython

Copy

```
GET /v2/users/me/accounts HTTP/1.1
Host: backend.blotato.com
blotato-api-key: YOUR_API_KEY
Accept: */*
```

Test it

200

Default Response

chevron-down

Copy

```
{
  "items": [\
    [\
      {\
        "id": "12345",\
        "platform": "twitter",\
        "fullname": "John Doe",\
        "username": "@johndoe"\
      }\
    ]\
  ]
}
```

### [hashtag](https://help.blotato.com/api/openapi-reference/accounts\#get-v2-users-me-accounts-accountid-subaccounts)    Get current user subaccounts

get

https://backend.blotato.com/v2/users/me/accounts/{accountId}/subaccounts

Fetches the current user's subaccounts for a specific account. Subaccounts are typically used for platforms like Facebook where a user can have multiple pages.

Authorizations

apiKeychevron-down

apiKey

blotato-api-keystringRequired

Path parameters

accountIdstringRequired

Responses

chevron-right

200

Default Response

application/json

itemsobject\[\]RequiredExample: `{"id":"facebook_page_12345","accountId":"account_67890","name":"My Facebook Page"}`

Show propertiesplus

chevron-right

401

Unauthorized

application/json

chevron-right

500

Server error

application/json

get

/v2/users/me/accounts/{accountId}/subaccounts

HTTPchevron-down

HTTPcURLJavaScriptPython

Copy

```
GET /v2/users/me/accounts/{accountId}/subaccounts HTTP/1.1
Host: backend.blotato.com
blotato-api-key: YOUR_API_KEY
Accept: */*
```

Test it

200

Default Response

chevron-down

Copy

```
{
  "items": [\
    {\
      "id": "facebook_page_12345",\
      "accountId": "account_67890",\
      "name": "My Facebook Page"\
    }\
  ]
}
```

[PreviousPublishingchevron-left](https://help.blotato.com/api/openapi-reference/publishing) [NextVideochevron-right](https://help.blotato.com/api/openapi-reference/video)

Last updated 7 minutes ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Video | Blotato Help
URL: https://help.blotato.com/api/openapi-reference/video

Endpoints related to video creation and management.

### [hashtag](https://help.blotato.com/api/openapi-reference/video\#delete-v2-videos-id)    Remove a video by ID

delete

https://backend.blotato.com/v2/videos/{id}

Deletes a video by its ID. This is used to remove videos that are no longer needed or were created in error.

Authorizations

apiKeychevron-down

apiKey

blotato-api-keystringRequired

Path parameters

idstringRequired

Video ID

Example: `123e4567-e89b-12d3-a456-426614174000`

Responses

chevron-right

204

Success

application/json

Success

idstringRequired

Video ID

Example: `123e4567-e89b-12d3-a456-426614174000`

chevron-right

500

Server error

application/json

delete

/v2/videos/{id}

HTTPchevron-down

HTTPcURLJavaScriptPython

Copy

```
DELETE /v2/videos/{id} HTTP/1.1
Host: backend.blotato.com
blotato-api-key: YOUR_API_KEY
Accept: */*
```

Test it

204

Success

chevron-down

Copy

```
{
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

### [hashtag](https://help.blotato.com/api/openapi-reference/video\#get-v2-videos-creations-id)    Get a single video

get

https://backend.blotato.com/v2/videos/creations/{id}

Retrieves the video by its ID. This is useful for polling after creating a video programmatically.

Authorizations

apiKeychevron-down

apiKey

blotato-api-keystringRequired

Path parameters

idstringRequired

Video ID

Example: `123e4567-e89b-12d3-a456-426614174000`

Responses

chevron-right

200

Default Response

application/json

chevron-right

404

Not found

application/json

chevron-right

500

Server error

application/json

get

/v2/videos/creations/{id}

HTTPchevron-down

HTTPcURLJavaScriptPython

Copy

```
GET /v2/videos/creations/{id} HTTP/1.1
Host: backend.blotato.com
blotato-api-key: YOUR_API_KEY
Accept: */*
```

Test it

200

Default Response

chevron-down

Copy

```
{
  "item": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "completed",
    "createdAt": "2026-03-28T15:43:56.775Z",
    "mediaUrl": "https://database.blotato.io/media/12345.mp4"
  }
}
```

### [hashtag](https://help.blotato.com/api/openapi-reference/video\#post-v2-videos-from-templates)    Create a video from the new template system

post

https://backend.blotato.com/v2/videos/from-templates

Creates a new video using a template. The template takes an ID and input parameters. You can also provide an optional prompt to fill out the input parameters automatically.

Authorizations

apiKeychevron-down

apiKey

blotato-api-keystringRequired

Body

application/jsonchevron-down

application/json

templateIdstringRequired

inputsanyRequired

promptstringOptional

isDraftbooleanOptionalDefault: `false`

renderbooleanRequiredDefault: `true`

useBrandKitbooleanOptionalDefault: `false`

Responses

chevron-right

201

Default Response

application/json

chevron-right

404

Not found

application/json

chevron-right

500

Default Response

application/json

post

/v2/videos/from-templates

HTTPchevron-down

HTTPcURLJavaScriptPython

Copy

```
POST /v2/videos/from-templates HTTP/1.1
Host: backend.blotato.com
blotato-api-key: YOUR_API_KEY
Content-Type: application/json
Accept: */*
Content-Length: 101

{
  "templateId": "text",
  "inputs": null,
  "prompt": "text",
  "isDraft": false,
  "render": true,
  "useBrandKit": false
}
```

Test it

201

Default Response

chevron-down

Copy

```
{
  "item": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "queueing"
  }
}
```

### [hashtag](https://help.blotato.com/api/openapi-reference/video\#get-v2-videos-templates)    List all templates

get

https://backend.blotato.com/v2/videos/templates

List all available video templates along with the specification of their input parameters.

Authorizations

apiKeychevron-down

apiKey

blotato-api-keystringRequired

Query parameters

fieldsstringOptional

Comma separated list of fields to include. If provided, only these fields will be included in the response for each template. If omitted, only id, title, and description are included. Id is always included in the response.

Default: `id,title,description`Example: `id,title,description,inputs`

searchstringOptional

Search regex term to filter templates by title or description. Has no effect if "id" is also provided.

Example: `real estate`

idstringOptional

If provided, only the template with this ID will be returned.

Example: `/base/v2/tweet-card/9714ae5c-7e6b-4878-be4a-4b1ba5d0cd66/v1`

Responses

chevron-right

200

Default Response

application/json

chevron-right

500

Default Response

application/json

get

/v2/videos/templates

HTTPchevron-down

HTTPcURLJavaScriptPython

Copy

```
GET /v2/videos/templates HTTP/1.1
Host: backend.blotato.com
blotato-api-key: YOUR_API_KEY
Accept: */*
```

Test it

200

Default Response

chevron-down

Copy

```
{
  "items": []
}
```

[PreviousAccountschevron-left](https://help.blotato.com/api/openapi-reference/accounts) [NextAI Videoschevron-right](https://help.blotato.com/features/videos)

Last updated 7 minutes ago

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

# Blotato Help
URL: https://help.blotato.com/api/media

## Page not found

The page you are looking for doesn't exist.

This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the [privacy policy](https://blotato.com/privacy-policy).

close

AcceptReject

---

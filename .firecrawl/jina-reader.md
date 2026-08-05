# Reader

Convert a URL to LLM-friendly input by prepending `r.jina.ai`.

_code_ API

* * *

_play\_arrow_ Demo _arrow\_drop\_down_

* * *

_attach\_money_ Pricing

## [Reader API](https://jina.ai/reader/\#apiform)

Convert a URL to LLM-friendly input by prepending `r.jina.ai`.

_login_

_key_ API Key & Billing

_code_ Usage

_more\_horiz_ More

_chevron\_left_ _chevron\_right_

* * *

[_home_](https://jina.ai/reader)

[_speed_ Rate Limit](https://jina.ai/api-dashboard/rate-limit)

[_bug\_report_ Raise issue](https://github.com/jina-ai/reader/issues)

[_help\_outline_ FAQ](https://jina.ai/reader#faq)

_menu\_book_ Docs _arrow\_drop\_down_

[Status](https://status.jina.ai/)

_chevron\_left_ _chevron\_right_

* * *

_globe\_book_

Use `r.jina.ai` to read a URL and fetch its content

_travel\_explore_

Use `s.jina.ai` to search the web and get SERP

_![](data:image/svg+xml,%3csvg%20fill='%23fff'%20fill-rule='evenodd'%20height='1em'%20style='flex:none;line-height:1'%20viewBox='0%200%2024%2024'%20width='1em'%20xmlns='http://www.w3.org/2000/svg'%3e%3ctitle%3eModelContextProtocol%3c/title%3e%3cpath%20d='M15.688%202.343a2.588%202.588%200%2000-3.61%200l-9.626%209.44a.863.863%200%2001-1.203%200%20.823.823%200%20010-1.18l9.626-9.44a4.313%204.313%200%20016.016%200%204.116%204.116%200%20011.204%203.54%204.3%204.3%200%20013.609%201.18l.05.05a4.115%204.115%200%20010%205.9l-8.706%208.537a.274.274%200%20000%20.393l1.788%201.754a.823.823%200%20010%201.18.863.863%200%2001-1.203%200l-1.788-1.753a1.92%201.92%200%20010-2.754l8.706-8.538a2.47%202.47%200%20000-3.54l-.05-.049a2.588%202.588%200%2000-3.607-.003l-7.172%207.034-.002.002-.098.097a.863.863%200%2001-1.204%200%20.823.823%200%20010-1.18l7.273-7.133a2.47%202.47%200%2000-.003-3.537z'%3e%3c/path%3e%3cpath%20d='M14.485%204.703a.823.823%200%20000-1.18.863.863%200%2000-1.204%200l-7.119%206.982a4.115%204.115%200%20000%205.9%204.314%204.314%200%20006.016%200l7.12-6.982a.823.823%200%20000-1.18.863.863%200%2000-1.204%200l-7.119%206.982a2.588%202.588%200%2001-3.61%200%202.47%202.47%200%20010-3.54l7.12-6.982z'%3e%3c/path%3e%3c/svg%3e)_

Add `mcp.jina.ai` as your MCP server to access our API in LLMs

* * *

Parameters

_arrow\_drop\_down_

The target URL to fetch content from

Add API Key for Higher Rate Limit

Enter your Jina API key to access a higher rate limit. For latest rate limit information, please refer to the table below. [_open\_in\_new_ Learn more](https://jina.ai/reader#rate-limit)

Browser Engine (Quality/Speed)

Choose the browser engine for fetching the webpage content. This affects the quality, speed, completeness, accessibility of the content. [_open\_in\_new_ Learn more](https://jina.ai/api-dashboard/reader-speed-test)

Default

_arrow\_drop\_down_

Content Format

You can control the level of detail in the response to prevent over-filtering. The default pipeline is optimized for most websites and LLM input.

Default

_arrow\_drop\_down_

JSON Response

The response will be in JSON format, containing the URL, title, content, and timestamp (if available). In Search mode, it returns a list of five entries, each following the described JSON structure.

Timeout (seconds)

Maximum time to wait for page load. Increase for slow pages, decrease for simple static pages.

Token Budget

Limits the maximum number of tokens used for this request. Exceeding this limit will cause the request to fail.

Use ReaderLM-v2

Experimental

Uses ReaderLM-v2 for HTML to Markdown conversion, to deliver high-quality results for websites with complex structures and contents. Costs 3x tokens! [_open\_in\_new_ Learn more](https://jina.ai/news/readerlm-v2-frontier-small-language-model-for-html-to-markdown-and-json)

Extract Only (CSS Selector)

Only extract content matching these CSS selectors. Example: article, .main-content, #post-body

body

.class

#id

Wait For (CSS Selector)

Wait until these elements appear before extracting content. Useful for dynamically loaded content.

body

.class

#id

Exclude (CSS Selector)

Remove these elements before extraction. Example: nav, footer, .sidebar, #ads

header

.class

#id

Remove All Images

Strip all images from the output. Reduces token usage when images are not needed.

OpenAI Citation Format

Format links for OpenAI's web browsing tool. Uses special citation markers compatible with GPT models. [_open\_in\_new_ Learn more](https://cookbook.openai.com/articles/openai-harmony#browser-tool)

Links Summary Section

A "Buttons & Links" section will be created at the end. This helps the downstream LLMs or web agents navigating the page or take further actions.

None

_arrow\_drop\_down_

Images Summary Section

An "Images" section will be created at the end. This gives the downstream LLMs an overview of all visuals on the page, which may improve reasoning.

None

_arrow\_drop\_down_

Browser Viewport Size

POST

Set browser window dimensions. Affects responsive layouts and content visibility. [_open\_in\_new_ Learn more](https://pptr.dev/api/puppeteer.viewport)

Forward Cookie

Our API server can forward your custom cookie settings when accessing the URL, which is useful for pages requiring extra authentication. Note that requests with cookies will not be cached. [_open\_in\_new_ Learn more](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)

<cookie-name>=<cookie-value>

<cookie-name-1>=<cookie-value>; domain=<cookie-1-domain>

Image Caption

Captions all images at the specified URL, adding 'Image \[idx\]: \[caption\]' as an alt tag for those without one. This allows downstream LLMs to interact with the images in activities such as reasoning and summarizing.

Use a Proxy Server

Our API server can utilize your proxy to access URLs, which is helpful for pages accessible only through specific proxies. [_open\_in\_new_ Learn more](https://en.wikipedia.org/wiki/Proxy_server)

Use a Country-Specific Proxy Server

Set country code for location-based proxy server. Use 'auto' for optimal selection or 'none' to disable.

Bypass Cached Content

Our API caches URL contents for a certain amount of time. Set it to true to ignore the cached result and fetch the content from the URL directly.

Cache Tolerance (seconds)

Accept cached content if younger than N seconds. Set to 0 for fresh content (same as Bypass Cache), or higher values to allow faster responses from cache.

Page Ready Timing

When to consider a page fully loaded. Later timings wait longer but capture more dynamic content.

Default

_arrow\_drop\_down_

Custom User-Agent

Override the browser User-Agent string. Useful for accessing sites that require specific browsers or block crawlers.

Custom Referer

Set the HTTP Referer header. Some sites check this to verify traffic comes from expected sources.

Preserve Base64 Images

Keep inline base64-encoded images in markdown output instead of converting them to external URLs.

Do Not Cache or Track

Prevent this request from being cached or logged on our servers. Use for sensitive URLs.

Github Flavored Markdown

Opt in/out features from GFM (Github Flavored Markdown).

Enabled

_arrow\_drop\_down_

Stream Mode

Stream mode is beneficial for large target pages, allowing more time for the page to fully render. If standard mode results in incomplete content, consider using Stream mode. [_open\_in\_new_ Learn more](https://github.com/jina-ai/reader?tab=readme-ov-file#streaming-mode)

Customize Browser Locale

Control the browser locale to render the page. Lots of websites serve different content based on the locale. [_open\_in\_new_ Learn more](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language)

Respect robots.txt

Check robots.txt rules before fetching. Specify which bot name to use for the check.

Include iframe Content

Extract content from embedded iframes. Enable for pages with content loaded in iframes.

Include Shadow DOM

Extract content from Shadow DOM components. Enable for pages using web components.

Use Final URL as Base

Resolve relative URLs using the final destination URL after redirects, instead of the original URL.

Local PDF/HTML file

POST

Use Reader on your local PDF and HTML file by uploading them. Only support pdf and html files. For HTML, please also specify a reference URL for better parsing related CSS/JS scripts.

_upload_

Run JavaScript Before Extraction

POST

Execute custom JS to modify the page before content extraction. Can be inline code or a URL to a script file. [_open\_in\_new_ Learn more](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

Heading Style

Sets markdown heading format (passed to Turndown).

Hash Style

_arrow\_drop\_down_

Horizontal Rule Style

Defines markdown horizontal rule format (passed to Turndown).

Bullet Point Style

Sets bullet list marker character (passed to Turndown).

\*

_arrow\_drop\_down_

Emphasis Style

Defines markdown emphasis delimiter (passed to Turndown).

\_

_arrow\_drop\_down_

Strong Emphasis Style

Sets markdown strong emphasis delimiter (passed to Turndown).

\*\*

_arrow\_drop\_down_

Link Style

Determines markdown link format (passed to Turndown).

Inline

_arrow\_drop\_down_

EU Residency

Experimental

When enabled, infrastructure and data processing for this request are located within the EU.

* * *

_upload_

Request

GET

Bash

Language

_arrow\_drop\_down_

_wrap\_text_

```bash
curl "https://r.jina.ai/https://www.example.com"
```

_content\_copy_

* * *

_send_ GET RESPONSE

* * *

_key_

API key

_visibility\_off_ _content\_copy_

* * *

Available tokens

0 _sync_

This is your unique key. Store it securely!

## Jina VLM: Small Multilingual Vision Language Model

A 2.4B parameter vision-language model that achieves state-of-the-art multilingual visual question answering among open 2B-scale VLMs.

![](https://jina.ai/blog-banner/jina-vlm-small-multilingual-vision-language-model.gif)

[Read Release Note _arrow\_forward_](https://jina.ai/news/jina-vlm-small-multilingual-vision-language-model)

## ReaderLM v2: Small Language Model for HTML to Markdown and JSON

ReaderLM-v2 is a 1.5B parameter language model specialized in HTML-to-Markdown conversion and HTML-to-JSON extraction. It supports documents up to 512K tokens across 29 languages and offers 20% higher accuracy compared to its predecessor.

![](https://jina.ai/assets/animation-readerlm-v2-BZGhT4e1.gif)

## [What is Reader?](https://jina.ai/reader/\#what_reader)

![](https://jina.ai/assets/explain-EQrFe5k3.svg)

Feeding web information into LLMs is an important step of grounding, yet it can be challenging. The simplest method is to scrape the webpage and feed the raw HTML. However, scraping can be complex and often blocked, and raw HTML is cluttered with extraneous elements like markups and scripts. The Reader API addresses these issues by extracting the core content from a URL and converting it into clean, LLM-friendly text, ensuring high-quality input for your agent and RAG systems. The Reader API is developer infrastructure: it converts a URL you supply into LLM-friendly text so you can build your own search, RAG, and agent systems. It is not a consumer search engine and does not index or rank the web on your behalf; you control which URLs are processed and are responsible for how the output is used.

_casino_

Enter your URL

_open\_in\_new_

Click below to fetch the source code of the page directly

* * *

Reader URL

_content\_copy__open\_in\_new_

Click below to obtain the content through our Reader API

* * *

_download_ Fetch Content

* * *

Raw HTML

_content\_copy_

* * *

Reader Output

_content\_copy_

* * *

Pose a Question

_send_

Input a question and combine it with the fetched content for LLM to generate an answer

## [Reader for web search and SERP](https://jina.ai/reader/\#search)

![](https://jina.ai/assets/explain3-CqNg2V0h.svg)

Reader can be used as SERP API. It allows you to feed your LLM with the content behind the search results engine page. Simply prepend `https://s.jina.ai/?q=` to your query, and Reader will search the web and return the top five results with their URLs and contents, each in clean, LLM-friendly text. This way, you can always keep your LLM up-to-date, improve its factuality, and reduce hallucinations.

_casino_

Enter your query

Type a question that requires latest information or world knowledge.

* * *

Reader URL

_content\_copy__open\_in\_new_

If you use this URL in code, dont forget to encode the URL.

* * *

_contact\_support_ Ask LLM w/o & w/ Search Grounding

* * *

_info_ Please note that unlike the demo shown above, in practice you do not search the original question on the web for grounding. What people often do is rewrite the original question or use multi-hop questions. They read the retrieved results and then generate additional queries to gather more information as needed before arriving at a final answer.

## [Reader also reads images!](https://jina.ai/reader/\#read-image)

![](https://jina.ai/assets/explain2-BYDhf_rF.svg)

Images on the webpage are automatically captioned using a vision language model in the reader and formatted as image alt tags in the output. This gives your downstream LLM just enough hints to incorporate those images into its reasoning and summarizing processes. This means you can ask questions about the images, select specific ones, or even forward their URLs to a more powerful VLM for deeper analysis!

## [Reader also reads PDFs!](https://jina.ai/reader/\#read-pdf)

![](https://jina.ai/assets/explain4-CPLfQrjf.png)

Yes, Reader natively supports PDF reading. It's compatible with most PDFs, including those with many images, and it's lightning fast! Combined with an LLM, you can easily build a ChatPDF or document analysis AI in no time.

[_open\_in\_new_ Original PDF](https://www.nasa.gov/wp-content/uploads/2023/01/55583main_vision_space_exploration2.pdf)

* * *

[_open\_in\_new_ Reader Result](https://r.jina.ai/https://www.nasa.gov/wp-content/uploads/2023/01/55583main_vision_space_exploration2.pdf)

## The best part? It's free!

Reader API is available for free and offers flexible rate limit and pricing. Built on a scalable infrastructure, it offers high accessibility, concurrency, and reliability. We strive to be your preferred grounding solution for your LLMs.

Rate Limit

Rate limits are tracked in three ways: **RPM** (requests per minute), and **TPM** (tokens per minute). Limits are enforced per IP/API key and will be triggered when either the RPM or TPM threshold is reached first. When you provide an API key in the request header, we track rate limits by key rather than IP address.

Columns

_arrow\_drop\_down_

_fullscreen_

|  | Product | API Endpoint | Description _arrow\_upward_ | w/o API Key _key\_off_ | w/ Free API Key _key_ | w/ Paid API Key _key_ | w/ Premium API Key _key_ | Average Latency | Token Usage Counting | Allowed Request |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ![](https://jina.ai/assets/reader-D06QTWF1.svg) | Reader API | `https://r.jina.ai` | Convert URL to LLM-friendly text | 20 RPM | 500 RPM | 500 RPM | _trending\_up_ 5000 RPM | 7.9s | Count the number of tokens in the output response. | GET/POST |
| ![](https://jina.ai/assets/reader-D06QTWF1.svg) | Reader API | `https://s.jina.ai` | Search the web and convert results to LLM-friendly text | _block_ | 100 RPM | 100 RPM | _trending\_up_ 1000 RPM | 2.5s | Every request costs a fixed number of tokens, starting from 10000 tokens | GET/POST |
| ![](https://jina.ai/assets/embedding-DzEuY8_E.svg) | Embedding API | `https://api.jina.ai/v1/embeddings` | Convert text/images to fixed-length vectors | _block_ | 100 RPM & 100,000 TPM | 500 RPM & 2,000,000 TPM | _trending\_up_ 5,000 RPM & 50,000,000 TPM | _ssid\_chart_ <br>depends on the input size<br>_help_ | Count the number of tokens in the input request. | POST |
| ![](https://jina.ai/assets/reranker-DudpN0Ck.svg) | Reranker API | `https://api.jina.ai/v1/rerank` | Rank documents by query | _block_ | 100 RPM & 100,000 TPM | 500 RPM & 2,000,000 TPM | _trending\_up_ 5,000 RPM & 50,000,000 TPM | _ssid\_chart_ <br>depends on the input size<br>_help_ | Count the number of tokens in the input request. | POST |
| ![](data:image/svg+xml,%3csvg%20width='240'%20height='240'%20viewBox='0%200%20240%20240'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20184.388L184.388%20152.304H152.304V184.388ZM146.922%20190.885V149.613C146.922%20148.127%20148.127%20146.922%20149.613%20146.922H190.886C193.283%20146.922%20194.484%20149.821%20192.789%20151.516L151.516%20192.788C149.821%20194.484%20146.922%20193.283%20146.922%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20133.927L184.388%20101.843H152.304V133.927ZM146.922%20140.424V99.1521C146.922%2097.6657%20148.127%2096.4608%20149.613%2096.4608H190.886C193.283%2096.4608%20194.484%2099.3597%20192.789%20101.055L151.516%20142.327C149.821%20144.023%20146.922%20142.822%20146.922%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20184.806L83.4668%20152.722H51.3828V184.806ZM46.0003%20191.303V150.031C46.0003%20148.545%2047.2053%20147.34%2048.6916%20147.34H89.964C92.3616%20147.34%2093.5624%20150.239%2091.867%20151.934L50.5946%20193.206C48.8992%20194.902%2046.0003%20193.701%2046.0003%20191.303Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20184.388L133.927%20152.304H101.843V184.388ZM96.4608%20190.885V149.613C96.4608%20148.127%2097.6657%20146.922%2099.152%20146.922H140.424C142.822%20146.922%20144.023%20149.821%20142.327%20151.516L101.055%20192.788C99.3597%20194.484%2096.4608%20193.283%2096.4608%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20133.927L133.927%20101.843H101.843V133.927ZM96.4608%20140.424V99.1521C96.4608%2097.6657%2097.6657%2096.4608%2099.152%2096.4608H140.424C142.822%2096.4608%20144.023%2099.3597%20142.327%20101.055L101.055%20142.327C99.3597%20144.023%2096.4608%20142.822%2096.4608%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%2083.4664L133.927%2051.3825H101.843V83.4664ZM96.4608%2089.9637V48.6913C96.4608%2047.2049%2097.6657%2046%2099.152%2046H140.424C142.822%2046%20144.023%2048.8989%20142.327%2050.5943L101.055%2091.8667C99.3597%2093.5621%2096.4608%2092.3613%2096.4608%2089.9637Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20132.808L83.4668%20100.725H51.3828V132.808ZM46.0003%20139.306V98.0333C46.0003%2096.547%2047.2053%2095.3421%2048.6916%2095.3421H89.964C92.3616%2095.3421%2093.5624%2098.2409%2091.867%2099.9363L50.5946%20141.209C48.8992%20142.904%2046.0003%20141.703%2046.0003%20139.306Z'%20fill='white'/%3e%3cpath%20d='M190.891%2046H149.619C147.221%2046%20146.02%2048.8989%20147.716%2050.5943L188.988%2091.8667C190.683%2093.5621%20193.582%2092.3613%20193.582%2089.9637V48.6913C193.582%2047.2049%20192.377%2046%20190.891%2046Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3826%2083.4664L83.4665%2051.3825H51.3826V83.4664ZM46.0001%2089.9637V48.6913C46.0001%2047.2049%2047.205%2046%2048.6914%2046H89.9638C92.3614%2046%2093.5621%2048.8989%2091.8668%2050.5943L50.5944%2091.8667C48.899%2093.5621%2046.0001%2092.3613%2046.0001%2089.9637Z'%20fill='white'/%3e%3c/svg%3e) | Classifier API | `https://api.jina.ai/v1/train` | Train a classifier using labeled examples | _block_ | 25 RPM & 25,000 TPM | 125 RPM & 500,000 TPM | 1,250 RPM & 12,000,000 TPM | _ssid\_chart_ <br>depends on the input size | Tokens counted as: input\_tokens × num\_iters | POST |
| ![](data:image/svg+xml,%3csvg%20width='240'%20height='240'%20viewBox='0%200%20240%20240'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20184.388L184.388%20152.304H152.304V184.388ZM146.922%20190.885V149.613C146.922%20148.127%20148.127%20146.922%20149.613%20146.922H190.886C193.283%20146.922%20194.484%20149.821%20192.789%20151.516L151.516%20192.788C149.821%20194.484%20146.922%20193.283%20146.922%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20133.927L184.388%20101.843H152.304V133.927ZM146.922%20140.424V99.1521C146.922%2097.6657%20148.127%2096.4608%20149.613%2096.4608H190.886C193.283%2096.4608%20194.484%2099.3597%20192.789%20101.055L151.516%20142.327C149.821%20144.023%20146.922%20142.822%20146.922%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20184.806L83.4668%20152.722H51.3828V184.806ZM46.0003%20191.303V150.031C46.0003%20148.545%2047.2053%20147.34%2048.6916%20147.34H89.964C92.3616%20147.34%2093.5624%20150.239%2091.867%20151.934L50.5946%20193.206C48.8992%20194.902%2046.0003%20193.701%2046.0003%20191.303Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20184.388L133.927%20152.304H101.843V184.388ZM96.4608%20190.885V149.613C96.4608%20148.127%2097.6657%20146.922%2099.152%20146.922H140.424C142.822%20146.922%20144.023%20149.821%20142.327%20151.516L101.055%20192.788C99.3597%20194.484%2096.4608%20193.283%2096.4608%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20133.927L133.927%20101.843H101.843V133.927ZM96.4608%20140.424V99.1521C96.4608%2097.6657%2097.6657%2096.4608%2099.152%2096.4608H140.424C142.822%2096.4608%20144.023%2099.3597%20142.327%20101.055L101.055%20142.327C99.3597%20144.023%2096.4608%20142.822%2096.4608%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%2083.4664L133.927%2051.3825H101.843V83.4664ZM96.4608%2089.9637V48.6913C96.4608%2047.2049%2097.6657%2046%2099.152%2046H140.424C142.822%2046%20144.023%2048.8989%20142.327%2050.5943L101.055%2091.8667C99.3597%2093.5621%2096.4608%2092.3613%2096.4608%2089.9637Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20132.808L83.4668%20100.725H51.3828V132.808ZM46.0003%20139.306V98.0333C46.0003%2096.547%2047.2053%2095.3421%2048.6916%2095.3421H89.964C92.3616%2095.3421%2093.5624%2098.2409%2091.867%2099.9363L50.5946%20141.209C48.8992%20142.904%2046.0003%20141.703%2046.0003%20139.306Z'%20fill='white'/%3e%3cpath%20d='M190.891%2046H149.619C147.221%2046%20146.02%2048.8989%20147.716%2050.5943L188.988%2091.8667C190.683%2093.5621%20193.582%2092.3613%20193.582%2089.9637V48.6913C193.582%2047.2049%20192.377%2046%20190.891%2046Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3826%2083.4664L83.4665%2051.3825H51.3826V83.4664ZM46.0001%2089.9637V48.6913C46.0001%2047.2049%2047.205%2046%2048.6914%2046H89.9638C92.3614%2046%2093.5621%2048.8989%2091.8668%2050.5943L50.5944%2091.8667C48.899%2093.5621%2046.0001%2092.3613%2046.0001%2089.9637Z'%20fill='white'/%3e%3c/svg%3e) | Classifier API (Few-shot) | `https://api.jina.ai/v1/classify` | Classify inputs using a trained few-shot classifier | _block_ | 25 RPM & 25,000 TPM | 125 RPM & 500,000 TPM | 1,250 RPM & 12,000,000 TPM | _ssid\_chart_ <br>depends on the input size | Tokens counted as: input\_tokens | POST |
| ![](data:image/svg+xml,%3csvg%20width='240'%20height='240'%20viewBox='0%200%20240%20240'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20184.388L184.388%20152.304H152.304V184.388ZM146.922%20190.885V149.613C146.922%20148.127%20148.127%20146.922%20149.613%20146.922H190.886C193.283%20146.922%20194.484%20149.821%20192.789%20151.516L151.516%20192.788C149.821%20194.484%20146.922%20193.283%20146.922%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20133.927L184.388%20101.843H152.304V133.927ZM146.922%20140.424V99.1521C146.922%2097.6657%20148.127%2096.4608%20149.613%2096.4608H190.886C193.283%2096.4608%20194.484%2099.3597%20192.789%20101.055L151.516%20142.327C149.821%20144.023%20146.922%20142.822%20146.922%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20184.806L83.4668%20152.722H51.3828V184.806ZM46.0003%20191.303V150.031C46.0003%20148.545%2047.2053%20147.34%2048.6916%20147.34H89.964C92.3616%20147.34%2093.5624%20150.239%2091.867%20151.934L50.5946%20193.206C48.8992%20194.902%2046.0003%20193.701%2046.0003%20191.303Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20184.388L133.927%20152.304H101.843V184.388ZM96.4608%20190.885V149.613C96.4608%20148.127%2097.6657%20146.922%2099.152%20146.922H140.424C142.822%20146.922%20144.023%20149.821%20142.327%20151.516L101.055%20192.788C99.3597%20194.484%2096.4608%20193.283%2096.4608%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20133.927L133.927%20101.843H101.843V133.927ZM96.4608%20140.424V99.1521C96.4608%2097.6657%2097.6657%2096.4608%2099.152%2096.4608H140.424C142.822%2096.4608%20144.023%2099.3597%20142.327%20101.055L101.055%20142.327C99.3597%20144.023%2096.4608%20142.822%2096.4608%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%2083.4664L133.927%2051.3825H101.843V83.4664ZM96.4608%2089.9637V48.6913C96.4608%2047.2049%2097.6657%2046%2099.152%2046H140.424C142.822%2046%20144.023%2048.8989%20142.327%2050.5943L101.055%2091.8667C99.3597%2093.5621%2096.4608%2092.3613%2096.4608%2089.9637Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20132.808L83.4668%20100.725H51.3828V132.808ZM46.0003%20139.306V98.0333C46.0003%2096.547%2047.2053%2095.3421%2048.6916%2095.3421H89.964C92.3616%2095.3421%2093.5624%2098.2409%2091.867%2099.9363L50.5946%20141.209C48.8992%20142.904%2046.0003%20141.703%2046.0003%20139.306Z'%20fill='white'/%3e%3cpath%20d='M190.891%2046H149.619C147.221%2046%20146.02%2048.8989%20147.716%2050.5943L188.988%2091.8667C190.683%2093.5621%20193.582%2092.3613%20193.582%2089.9637V48.6913C193.582%2047.2049%20192.377%2046%20190.891%2046Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3826%2083.4664L83.4665%2051.3825H51.3826V83.4664ZM46.0001%2089.9637V48.6913C46.0001%2047.2049%2047.205%2046%2048.6914%2046H89.9638C92.3614%2046%2093.5621%2048.8989%2091.8668%2050.5943L50.5944%2091.8667C48.899%2093.5621%2046.0001%2092.3613%2046.0001%2089.9637Z'%20fill='white'/%3e%3c/svg%3e) | Classifier API (Zero-shot) | `https://api.jina.ai/v1/classify` | Classify inputs using zero-shot classification | _block_ | 25 RPM & 25,000 TPM | 125 RPM & 500,000 TPM | 1,250 RPM & 12,000,000 TPM | _ssid\_chart_ <br>depends on the input size | Tokens counted as: input\_tokens + label\_tokens | POST |
| ![](data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20width='320'%20zoomAndPan='magnify'%20viewBox='0%200%20240%20239.999995'%20height='320'%20preserveAspectRatio='xMidYMid%20meet'%20version='1.0'%3e%3cpath%20fill='%23ffffff'%20d='M%20132.328125%2039%20L%20144.652344%2060.351562%20L%20132.328125%2081.699219%20L%20107.675781%2081.699219%20L%2095.347656%2060.351562%20L%20107.675781%2039%20Z%20M%20184.96875%2058.523438%20L%20202%2088.023438%20L%20184.96875%20117.527344%20L%20153.011719%20117.527344%20L%20138.085938%20143.375%20L%20154.066406%20171.050781%20L%20137.03125%20200.554688%20L%20102.964844%20200.554688%20L%2085.933594%20171.050781%20L%20101.910156%20143.375%20L%2086.988281%20117.527344%20L%2055.03125%20117.527344%20L%2038%2088.027344%20L%2055.03125%2058.523438%20L%2089.097656%2058.523438%20L%20105.074219%2086.199219%20L%20134.921875%2086.199219%20L%20150.902344%2058.523438%20Z%20M%2057.140625%20113.875%20L%2086.988281%20113.875%20L%20101.914062%2088.023438%20L%2086.988281%2062.175781%20L%2057.140625%2062.175781%20L%2042.21875%2088.027344%20Z%20M%20105.074219%20141.550781%20L%2090.152344%20115.703125%20L%20105.078125%2089.851562%20L%20134.921875%2089.851562%20L%20149.847656%20115.699219%20L%20134.925781%20141.550781%20Z%20M%20138.085938%2088.023438%20L%20153.011719%2062.175781%20L%20182.859375%2062.175781%20L%20197.78125%2088.023438%20L%20182.859375%20113.875%20L%20153.011719%20113.875%20Z%20M%20105.074219%20145.203125%20L%2090.152344%20171.050781%20L%20105.074219%20196.902344%20L%20134.921875%20196.902344%20L%20149.847656%20171.050781%20L%20134.921875%20145.203125%20Z%20M%2096.71875%20143.375%20L%2084.390625%20122.027344%20L%2059.738281%20122.027344%20L%2047.414062%20143.375%20L%2059.738281%20164.726562%20L%2084.390625%20164.726562%20Z%20M%20192.585938%20143.375%20L%20180.261719%20122.023438%20L%20155.605469%20122.023438%20L%20143.28125%20143.375%20L%20155.605469%20164.726562%20L%20180.261719%20164.726562%20Z%20M%20192.585938%20143.375%20'%20fill-opacity='1'%20fill-rule='evenodd'/%3e%3c/svg%3e) | Segmenter API | `https://api.jina.ai/v1/segment` | Tokenize and segment long text | 20 RPM | 200 RPM | 200 RPM | 1,000 RPM | 0.3s | Token is not counted as usage. | GET/POST |
| ![](data:image/svg+xml,%3csvg%20width='240'%20height='240'%20viewBox='0%200%20240%20240'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M123.395%20131.064L162.935%20102.948L154.175%2087.776L123.395%20131.064ZM146.664%2074.7669L121.428%20129.927L129.479%2045.0007L146.664%2074.7669ZM117.189%20137.27L36%20195H76.1387L117.189%20137.27ZM93.2635%20195L119.156%20138.405L113.791%20195H93.2635ZM177.409%20128.018L124.531%20133.031L168.649%20112.846L177.409%20128.018ZM38.4785%20170.794L116.053%20135.302L55.6643%20141.027L38.4785%20170.794ZM184.92%20141.027L202.105%20170.793L124.531%20135.302L184.92%20141.027ZM116.053%20133.031L63.1751%20128.018L71.9347%20112.846L116.053%20133.031ZM123.395%20137.269L204.584%20195H164.446L123.395%20137.269ZM77.6493%20102.948L117.189%20131.063L86.4089%2087.7758L77.6493%20102.948ZM121.428%20138.406L126.793%20195H147.321L121.428%20138.406ZM119.156%20129.927L93.9197%2074.7667L111.105%2045L119.156%20129.927Z'%20fill='white'/%3e%3c/svg%3e) | DeepSearch | `https://deepsearch.jina.ai/v1/chat/completions` | Reason, search and iterate to find the best answer | _block_ | 50 RPM | 50 RPM | 500 RPM | 56.7s | Count the total number of tokens in the whole process. | POST |

Don't panic! Every new API key contains ten millions free tokens!

_key_ Get your API key

* * *

_attach\_money_ Check the price table

## [API Pricing](https://jina.ai/reader/\#pricing)

API pricing is based on the token usage. One API key gives you access to all search foundation products.

_![](https://jina.ai/J-active-light.svg)_

With Jina Search Foundation API

The easiest way to access all of our products. Top-up tokens as you go.

_content\_copy_

Enter the API key you wish to recharge

_error_

_visibility\_off_

Top up this API key with more tokens

Depending on your location, you may be charged in USD, EUR, or other currencies. Taxes may apply.

Please input the right API key to top up

Understand the rate limit

Rate limits are the maximum number of requests that can be made to an API within a minute per IP address/API key (RPM). Find out more about the rate limits for each product and tier below.

_keyboard\_arrow\_down_

Rate Limit

Rate limits are tracked in three ways: **RPM** (requests per minute), and **TPM** (tokens per minute). Limits are enforced per IP/API key and will be triggered when either the RPM or TPM threshold is reached first. When you provide an API key in the request header, we track rate limits by key rather than IP address.

Columns

_arrow\_drop\_down_

_fullscreen_

|  | Product | API Endpoint | Description _arrow\_upward_ | w/o API Key _key\_off_ | w/ Free API Key _key_ | w/ Paid API Key _key_ | w/ Premium API Key _key_ | Average Latency | Token Usage Counting | Allowed Request |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ![](https://jina.ai/assets/reader-D06QTWF1.svg) | Reader API | `https://r.jina.ai` | Convert URL to LLM-friendly text | 20 RPM | 500 RPM | 500 RPM | _trending\_up_ 5000 RPM | 7.9s | Count the number of tokens in the output response. | GET/POST |
| ![](https://jina.ai/assets/reader-D06QTWF1.svg) | Reader API | `https://s.jina.ai` | Search the web and convert results to LLM-friendly text | _block_ | 100 RPM | 100 RPM | _trending\_up_ 1000 RPM | 2.5s | Every request costs a fixed number of tokens, starting from 10000 tokens | GET/POST |
| ![](https://jina.ai/assets/embedding-DzEuY8_E.svg) | Embedding API | `https://api.jina.ai/v1/embeddings` | Convert text/images to fixed-length vectors | _block_ | 100 RPM & 100,000 TPM | 500 RPM & 2,000,000 TPM | _trending\_up_ 5,000 RPM & 50,000,000 TPM | _ssid\_chart_ <br>depends on the input size<br>_help_ | Count the number of tokens in the input request. | POST |
| ![](https://jina.ai/assets/reranker-DudpN0Ck.svg) | Reranker API | `https://api.jina.ai/v1/rerank` | Rank documents by query | _block_ | 100 RPM & 100,000 TPM | 500 RPM & 2,000,000 TPM | _trending\_up_ 5,000 RPM & 50,000,000 TPM | _ssid\_chart_ <br>depends on the input size<br>_help_ | Count the number of tokens in the input request. | POST |
| ![](data:image/svg+xml,%3csvg%20width='240'%20height='240'%20viewBox='0%200%20240%20240'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20184.388L184.388%20152.304H152.304V184.388ZM146.922%20190.885V149.613C146.922%20148.127%20148.127%20146.922%20149.613%20146.922H190.886C193.283%20146.922%20194.484%20149.821%20192.789%20151.516L151.516%20192.788C149.821%20194.484%20146.922%20193.283%20146.922%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20133.927L184.388%20101.843H152.304V133.927ZM146.922%20140.424V99.1521C146.922%2097.6657%20148.127%2096.4608%20149.613%2096.4608H190.886C193.283%2096.4608%20194.484%2099.3597%20192.789%20101.055L151.516%20142.327C149.821%20144.023%20146.922%20142.822%20146.922%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20184.806L83.4668%20152.722H51.3828V184.806ZM46.0003%20191.303V150.031C46.0003%20148.545%2047.2053%20147.34%2048.6916%20147.34H89.964C92.3616%20147.34%2093.5624%20150.239%2091.867%20151.934L50.5946%20193.206C48.8992%20194.902%2046.0003%20193.701%2046.0003%20191.303Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20184.388L133.927%20152.304H101.843V184.388ZM96.4608%20190.885V149.613C96.4608%20148.127%2097.6657%20146.922%2099.152%20146.922H140.424C142.822%20146.922%20144.023%20149.821%20142.327%20151.516L101.055%20192.788C99.3597%20194.484%2096.4608%20193.283%2096.4608%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20133.927L133.927%20101.843H101.843V133.927ZM96.4608%20140.424V99.1521C96.4608%2097.6657%2097.6657%2096.4608%2099.152%2096.4608H140.424C142.822%2096.4608%20144.023%2099.3597%20142.327%20101.055L101.055%20142.327C99.3597%20144.023%2096.4608%20142.822%2096.4608%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%2083.4664L133.927%2051.3825H101.843V83.4664ZM96.4608%2089.9637V48.6913C96.4608%2047.2049%2097.6657%2046%2099.152%2046H140.424C142.822%2046%20144.023%2048.8989%20142.327%2050.5943L101.055%2091.8667C99.3597%2093.5621%2096.4608%2092.3613%2096.4608%2089.9637Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20132.808L83.4668%20100.725H51.3828V132.808ZM46.0003%20139.306V98.0333C46.0003%2096.547%2047.2053%2095.3421%2048.6916%2095.3421H89.964C92.3616%2095.3421%2093.5624%2098.2409%2091.867%2099.9363L50.5946%20141.209C48.8992%20142.904%2046.0003%20141.703%2046.0003%20139.306Z'%20fill='white'/%3e%3cpath%20d='M190.891%2046H149.619C147.221%2046%20146.02%2048.8989%20147.716%2050.5943L188.988%2091.8667C190.683%2093.5621%20193.582%2092.3613%20193.582%2089.9637V48.6913C193.582%2047.2049%20192.377%2046%20190.891%2046Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3826%2083.4664L83.4665%2051.3825H51.3826V83.4664ZM46.0001%2089.9637V48.6913C46.0001%2047.2049%2047.205%2046%2048.6914%2046H89.9638C92.3614%2046%2093.5621%2048.8989%2091.8668%2050.5943L50.5944%2091.8667C48.899%2093.5621%2046.0001%2092.3613%2046.0001%2089.9637Z'%20fill='white'/%3e%3c/svg%3e) | Classifier API | `https://api.jina.ai/v1/train` | Train a classifier using labeled examples | _block_ | 25 RPM & 25,000 TPM | 125 RPM & 500,000 TPM | 1,250 RPM & 12,000,000 TPM | _ssid\_chart_ <br>depends on the input size | Tokens counted as: input\_tokens × num\_iters | POST |
| ![](data:image/svg+xml,%3csvg%20width='240'%20height='240'%20viewBox='0%200%20240%20240'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20184.388L184.388%20152.304H152.304V184.388ZM146.922%20190.885V149.613C146.922%20148.127%20148.127%20146.922%20149.613%20146.922H190.886C193.283%20146.922%20194.484%20149.821%20192.789%20151.516L151.516%20192.788C149.821%20194.484%20146.922%20193.283%20146.922%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20133.927L184.388%20101.843H152.304V133.927ZM146.922%20140.424V99.1521C146.922%2097.6657%20148.127%2096.4608%20149.613%2096.4608H190.886C193.283%2096.4608%20194.484%2099.3597%20192.789%20101.055L151.516%20142.327C149.821%20144.023%20146.922%20142.822%20146.922%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20184.806L83.4668%20152.722H51.3828V184.806ZM46.0003%20191.303V150.031C46.0003%20148.545%2047.2053%20147.34%2048.6916%20147.34H89.964C92.3616%20147.34%2093.5624%20150.239%2091.867%20151.934L50.5946%20193.206C48.8992%20194.902%2046.0003%20193.701%2046.0003%20191.303Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20184.388L133.927%20152.304H101.843V184.388ZM96.4608%20190.885V149.613C96.4608%20148.127%2097.6657%20146.922%2099.152%20146.922H140.424C142.822%20146.922%20144.023%20149.821%20142.327%20151.516L101.055%20192.788C99.3597%20194.484%2096.4608%20193.283%2096.4608%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20133.927L133.927%20101.843H101.843V133.927ZM96.4608%20140.424V99.1521C96.4608%2097.6657%2097.6657%2096.4608%2099.152%2096.4608H140.424C142.822%2096.4608%20144.023%2099.3597%20142.327%20101.055L101.055%20142.327C99.3597%20144.023%2096.4608%20142.822%2096.4608%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%2083.4664L133.927%2051.3825H101.843V83.4664ZM96.4608%2089.9637V48.6913C96.4608%2047.2049%2097.6657%2046%2099.152%2046H140.424C142.822%2046%20144.023%2048.8989%20142.327%2050.5943L101.055%2091.8667C99.3597%2093.5621%2096.4608%2092.3613%2096.4608%2089.9637Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20132.808L83.4668%20100.725H51.3828V132.808ZM46.0003%20139.306V98.0333C46.0003%2096.547%2047.2053%2095.3421%2048.6916%2095.3421H89.964C92.3616%2095.3421%2093.5624%2098.2409%2091.867%2099.9363L50.5946%20141.209C48.8992%20142.904%2046.0003%20141.703%2046.0003%20139.306Z'%20fill='white'/%3e%3cpath%20d='M190.891%2046H149.619C147.221%2046%20146.02%2048.8989%20147.716%2050.5943L188.988%2091.8667C190.683%2093.5621%20193.582%2092.3613%20193.582%2089.9637V48.6913C193.582%2047.2049%20192.377%2046%20190.891%2046Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3826%2083.4664L83.4665%2051.3825H51.3826V83.4664ZM46.0001%2089.9637V48.6913C46.0001%2047.2049%2047.205%2046%2048.6914%2046H89.9638C92.3614%2046%2093.5621%2048.8989%2091.8668%2050.5943L50.5944%2091.8667C48.899%2093.5621%2046.0001%2092.3613%2046.0001%2089.9637Z'%20fill='white'/%3e%3c/svg%3e) | Classifier API (Few-shot) | `https://api.jina.ai/v1/classify` | Classify inputs using a trained few-shot classifier | _block_ | 25 RPM & 25,000 TPM | 125 RPM & 500,000 TPM | 1,250 RPM & 12,000,000 TPM | _ssid\_chart_ <br>depends on the input size | Tokens counted as: input\_tokens | POST |
| ![](data:image/svg+xml,%3csvg%20width='240'%20height='240'%20viewBox='0%200%20240%20240'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20184.388L184.388%20152.304H152.304V184.388ZM146.922%20190.885V149.613C146.922%20148.127%20148.127%20146.922%20149.613%20146.922H190.886C193.283%20146.922%20194.484%20149.821%20192.789%20151.516L151.516%20192.788C149.821%20194.484%20146.922%20193.283%20146.922%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20133.927L184.388%20101.843H152.304V133.927ZM146.922%20140.424V99.1521C146.922%2097.6657%20148.127%2096.4608%20149.613%2096.4608H190.886C193.283%2096.4608%20194.484%2099.3597%20192.789%20101.055L151.516%20142.327C149.821%20144.023%20146.922%20142.822%20146.922%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20184.806L83.4668%20152.722H51.3828V184.806ZM46.0003%20191.303V150.031C46.0003%20148.545%2047.2053%20147.34%2048.6916%20147.34H89.964C92.3616%20147.34%2093.5624%20150.239%2091.867%20151.934L50.5946%20193.206C48.8992%20194.902%2046.0003%20193.701%2046.0003%20191.303Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20184.388L133.927%20152.304H101.843V184.388ZM96.4608%20190.885V149.613C96.4608%20148.127%2097.6657%20146.922%2099.152%20146.922H140.424C142.822%20146.922%20144.023%20149.821%20142.327%20151.516L101.055%20192.788C99.3597%20194.484%2096.4608%20193.283%2096.4608%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20133.927L133.927%20101.843H101.843V133.927ZM96.4608%20140.424V99.1521C96.4608%2097.6657%2097.6657%2096.4608%2099.152%2096.4608H140.424C142.822%2096.4608%20144.023%2099.3597%20142.327%20101.055L101.055%20142.327C99.3597%20144.023%2096.4608%20142.822%2096.4608%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%2083.4664L133.927%2051.3825H101.843V83.4664ZM96.4608%2089.9637V48.6913C96.4608%2047.2049%2097.6657%2046%2099.152%2046H140.424C142.822%2046%20144.023%2048.8989%20142.327%2050.5943L101.055%2091.8667C99.3597%2093.5621%2096.4608%2092.3613%2096.4608%2089.9637Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20132.808L83.4668%20100.725H51.3828V132.808ZM46.0003%20139.306V98.0333C46.0003%2096.547%2047.2053%2095.3421%2048.6916%2095.3421H89.964C92.3616%2095.3421%2093.5624%2098.2409%2091.867%2099.9363L50.5946%20141.209C48.8992%20142.904%2046.0003%20141.703%2046.0003%20139.306Z'%20fill='white'/%3e%3cpath%20d='M190.891%2046H149.619C147.221%2046%20146.02%2048.8989%20147.716%2050.5943L188.988%2091.8667C190.683%2093.5621%20193.582%2092.3613%20193.582%2089.9637V48.6913C193.582%2047.2049%20192.377%2046%20190.891%2046Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3826%2083.4664L83.4665%2051.3825H51.3826V83.4664ZM46.0001%2089.9637V48.6913C46.0001%2047.2049%2047.205%2046%2048.6914%2046H89.9638C92.3614%2046%2093.5621%2048.8989%2091.8668%2050.5943L50.5944%2091.8667C48.899%2093.5621%2046.0001%2092.3613%2046.0001%2089.9637Z'%20fill='white'/%3e%3c/svg%3e) | Classifier API (Zero-shot) | `https://api.jina.ai/v1/classify` | Classify inputs using zero-shot classification | _block_ | 25 RPM & 25,000 TPM | 125 RPM & 500,000 TPM | 1,250 RPM & 12,000,000 TPM | _ssid\_chart_ <br>depends on the input size | Tokens counted as: input\_tokens + label\_tokens | POST |
| ![](data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20width='320'%20zoomAndPan='magnify'%20viewBox='0%200%20240%20239.999995'%20height='320'%20preserveAspectRatio='xMidYMid%20meet'%20version='1.0'%3e%3cpath%20fill='%23ffffff'%20d='M%20132.328125%2039%20L%20144.652344%2060.351562%20L%20132.328125%2081.699219%20L%20107.675781%2081.699219%20L%2095.347656%2060.351562%20L%20107.675781%2039%20Z%20M%20184.96875%2058.523438%20L%20202%2088.023438%20L%20184.96875%20117.527344%20L%20153.011719%20117.527344%20L%20138.085938%20143.375%20L%20154.066406%20171.050781%20L%20137.03125%20200.554688%20L%20102.964844%20200.554688%20L%2085.933594%20171.050781%20L%20101.910156%20143.375%20L%2086.988281%20117.527344%20L%2055.03125%20117.527344%20L%2038%2088.027344%20L%2055.03125%2058.523438%20L%2089.097656%2058.523438%20L%20105.074219%2086.199219%20L%20134.921875%2086.199219%20L%20150.902344%2058.523438%20Z%20M%2057.140625%20113.875%20L%2086.988281%20113.875%20L%20101.914062%2088.023438%20L%2086.988281%2062.175781%20L%2057.140625%2062.175781%20L%2042.21875%2088.027344%20Z%20M%20105.074219%20141.550781%20L%2090.152344%20115.703125%20L%20105.078125%2089.851562%20L%20134.921875%2089.851562%20L%20149.847656%20115.699219%20L%20134.925781%20141.550781%20Z%20M%20138.085938%2088.023438%20L%20153.011719%2062.175781%20L%20182.859375%2062.175781%20L%20197.78125%2088.023438%20L%20182.859375%20113.875%20L%20153.011719%20113.875%20Z%20M%20105.074219%20145.203125%20L%2090.152344%20171.050781%20L%20105.074219%20196.902344%20L%20134.921875%20196.902344%20L%20149.847656%20171.050781%20L%20134.921875%20145.203125%20Z%20M%2096.71875%20143.375%20L%2084.390625%20122.027344%20L%2059.738281%20122.027344%20L%2047.414062%20143.375%20L%2059.738281%20164.726562%20L%2084.390625%20164.726562%20Z%20M%20192.585938%20143.375%20L%20180.261719%20122.023438%20L%20155.605469%20122.023438%20L%20143.28125%20143.375%20L%20155.605469%20164.726562%20L%20180.261719%20164.726562%20Z%20M%20192.585938%20143.375%20'%20fill-opacity='1'%20fill-rule='evenodd'/%3e%3c/svg%3e) | Segmenter API | `https://api.jina.ai/v1/segment` | Tokenize and segment long text | 20 RPM | 200 RPM | 200 RPM | 1,000 RPM | 0.3s | Token is not counted as usage. | GET/POST |
| ![](data:image/svg+xml,%3csvg%20width='240'%20height='240'%20viewBox='0%200%20240%20240'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M123.395%20131.064L162.935%20102.948L154.175%2087.776L123.395%20131.064ZM146.664%2074.7669L121.428%20129.927L129.479%2045.0007L146.664%2074.7669ZM117.189%20137.27L36%20195H76.1387L117.189%20137.27ZM93.2635%20195L119.156%20138.405L113.791%20195H93.2635ZM177.409%20128.018L124.531%20133.031L168.649%20112.846L177.409%20128.018ZM38.4785%20170.794L116.053%20135.302L55.6643%20141.027L38.4785%20170.794ZM184.92%20141.027L202.105%20170.793L124.531%20135.302L184.92%20141.027ZM116.053%20133.031L63.1751%20128.018L71.9347%20112.846L116.053%20133.031ZM123.395%20137.269L204.584%20195H164.446L123.395%20137.269ZM77.6493%20102.948L117.189%20131.063L86.4089%2087.7758L77.6493%20102.948ZM121.428%20138.406L126.793%20195H147.321L121.428%20138.406ZM119.156%20129.927L93.9197%2074.7667L111.105%2045L119.156%20129.927Z'%20fill='white'/%3e%3c/svg%3e) | DeepSearch | `https://deepsearch.jina.ai/v1/chat/completions` | Reason, search and iterate to find the best answer | _block_ | 50 RPM | 50 RPM | 500 RPM | 56.7s | Count the total number of tokens in the whole process. | POST |

Auto top-up on low token balance

Recommended for uninterrupted service in production. When your token balance drops below the set threshold, we will automatically recharge your saved payment method for the last purchased package, until the threshold is met.

_info_ We introduced a new pricing model on May 6th, 2025. If you enabled auto-recharge before this date, you'll continue to pay the old price (the one when you purchased). The new pricing only applies if you modify your auto-recharge settings or purchase a new API key.

_check_

< 1M Tokens

Top up when

_arrow\_drop\_down_

## [FAQ](https://jina.ai/reader/\#faq)

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

What are the costs associated with using the Reader API?

_keyboard\_arrow\_down_

Reader API is free for basic usage - simply prepend 'https://r.jina.ai/' to your URL. For higher rate limits, you can provide an API key which charges tokens based on content length. Check Q16 for rate limit details.

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

How does the Reader API function?

_keyboard\_arrow\_down_

The Reader API uses a proxy to fetch any URL, rendering its content in a browser to extract high-quality main content.

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

Is the Reader API open source?

_keyboard\_arrow\_down_

The Reader API code is available on the Jina AI GitHub repository. Note that the ReaderLM-v2 model is licensed under CC-BY-NC 4.0 for non-commercial use, not an open-source license.

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

What is the typical latency for the Reader API?

_keyboard\_arrow\_down_

The Reader API generally processes URLs and returns content within 2 seconds, although complex or dynamic pages might require more time.

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

Why should I use the Reader API instead of scraping the page myself?

_keyboard\_arrow\_down_

Scraping can be complicated and unreliable, particularly with complex or dynamic pages. The Reader API provides a streamlined, reliable output of clean, LLM-ready text.

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

Does the Reader API support multiple languages?

_keyboard\_arrow\_down_

The Reader API returns content in the original language of the URL. It does not provide translation services.

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

Does the Reader API respect website access controls?

_keyboard\_arrow\_down_

Yes. Reader operates as a standard web client and respects website access controls. If a website blocks the request, that outcome is respected. You are responsible for ensuring your use of Reader complies with the terms of the sites you access and does not infringe third-party intellectual property rights.

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

Can the Reader API extract content from PDF files?

_keyboard\_arrow\_down_

Yes, the Reader API can natively extract content from PDF files.

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

Can the Reader API process media content from web pages?

_keyboard\_arrow\_down_

Yes, Reader can caption images on webpages using the `x-with-generated-alt` header. This adds descriptive alt tags to images that lack them, enabling LLMs to understand visual content. Video summarization is planned for future releases.

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

Is it possible to use the Reader API on local HTML files?

_keyboard\_arrow\_down_

No, the Reader API can only process content from publicly accessible URLs.

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

Does Reader API cache the content?

_keyboard\_arrow\_down_

If you request the same URL within 5 minutes, the Reader API will return the cached content.

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

Can I use the Reader API to access content behind a login?

_keyboard\_arrow\_down_

Unfortunately not.

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

Can I use the Reader API to access PDF on arXiv?

_keyboard\_arrow\_down_

Yes, you can either use the native PDF support from the Reader (https://r.jina.ai/https://arxiv.org/pdf/2310.19923v4) or use the HTML version from the arXiv (https://r.jina.ai/https://arxiv.org/html/2310.19923v4)

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

How does image caption work in Reader?

_keyboard\_arrow\_down_

Reader captions all images at the specified URL and adds \`Image \[idx\]: \[caption\]\` as an alt tag (if they initially lack one). This enables downstream LLMs to interact with the images in reasoning, summarizing etc.

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

What is the scalability of the Reader? Can I use it in production?

_keyboard\_arrow\_down_

The Reader API is designed to be highly scalable. It is auto-scaled based on the real-time traffic and the maximum concurrency requests is now around 4000. We are maintaining it actively as one of the core products of Jina AI. So feel free to use it in production.

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

What is the rate limit of the Reader API?

_keyboard\_arrow\_down_

Please find the latest rate limit information in the table below. Note that we are actively working on improving the rate limit and performance of the Reader API, the table will be updated accordingly.

[_speed_ Rate limit](https://jina.ai/reader/#rate-limit)

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

What is Reader-LM? How can I use it?

_keyboard\_arrow\_down_

`ReaderLM-v2` is our latest small language model (SLM) for converting raw HTML into clean markdown or JSON. It offers a 3x quality improvement over v1 and can extract structured data using JSON schema or natural language instructions. You can use it directly via Reader API with the `x-respond-with: readerlm-v2` header, or deploy it from cloud marketplaces (AWS, Azure, GCP).

[_launch_ AWS SageMaker](https://aws.amazon.com/marketplace/seller-profile?id=seller-stch2ludm6vgy) [_launch_ Google Cloud](https://console.cloud.google.com/marketplace/browse?q=jina&pli=1&inv=1&invt=AbmydQ) [_launch_ Microsoft Azure](https://azuremarketplace.microsoft.com/en-US/marketplace/apps?page=1&search=jina)

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

How do I extract structured data from webpages?

_keyboard\_arrow\_down_

Use the `x-json-schema` header with a JSON schema definition, or use `x-instruction` header with natural language instructions. Both features work with ReaderLM-v2 to extract specific fields like prices, titles, dates, etc. from any webpage into structured JSON format.

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

Does Reader actively bypass website anti-bot protection?

_keyboard\_arrow\_down_

No. Reader does not actively circumvent or bypass any website defense mechanisms, anti-bot systems, or access controls. If a website detects our service as a bot and blocks the request, that outcome is respected. We operate as a standard web client and do not employ techniques designed to evade detection systems. You remain responsible for ensuring your use of Reader respects third-party intellectual property rights and the terms of the sites you access.

_![](https://jina.ai/assets/reader-D06QTWF1.svg)_

Will upgrading from a free to a paid API key give me access to more websites?

_keyboard\_arrow\_down_

No. Upgrading from a free tier to a paid API key does not grant access to additional websites or bypass any site restrictions. The difference between tiers is primarily in rate limits and performance optimizations. A paid API key provides higher request throughput and faster processing, but it does not enable access to websites that block our service.

### [How to get my API key?](https://jina.ai/reader/\#get-api-key)

video\_not\_supported

### [What's the rate limit?](https://jina.ai/reader/\#rate-limit)

Rate Limit

Rate limits are tracked in three ways: **RPM** (requests per minute), and **TPM** (tokens per minute). Limits are enforced per IP/API key and will be triggered when either the RPM or TPM threshold is reached first. When you provide an API key in the request header, we track rate limits by key rather than IP address.

Columns

_arrow\_drop\_down_

_fullscreen_

|  | Product | API Endpoint | Description _arrow\_upward_ | w/o API Key _key\_off_ | w/ Free API Key _key_ | w/ Paid API Key _key_ | w/ Premium API Key _key_ | Average Latency | Token Usage Counting | Allowed Request |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ![](https://jina.ai/assets/reader-D06QTWF1.svg) | Reader API | `https://r.jina.ai` | Convert URL to LLM-friendly text | 20 RPM | 500 RPM | 500 RPM | _trending\_up_ 5000 RPM | 7.9s | Count the number of tokens in the output response. | GET/POST |
| ![](https://jina.ai/assets/reader-D06QTWF1.svg) | Reader API | `https://s.jina.ai` | Search the web and convert results to LLM-friendly text | _block_ | 100 RPM | 100 RPM | _trending\_up_ 1000 RPM | 2.5s | Every request costs a fixed number of tokens, starting from 10000 tokens | GET/POST |
| ![](https://jina.ai/assets/embedding-DzEuY8_E.svg) | Embedding API | `https://api.jina.ai/v1/embeddings` | Convert text/images to fixed-length vectors | _block_ | 100 RPM & 100,000 TPM | 500 RPM & 2,000,000 TPM | _trending\_up_ 5,000 RPM & 50,000,000 TPM | _ssid\_chart_ <br>depends on the input size<br>_help_ | Count the number of tokens in the input request. | POST |
| ![](https://jina.ai/assets/reranker-DudpN0Ck.svg) | Reranker API | `https://api.jina.ai/v1/rerank` | Rank documents by query | _block_ | 100 RPM & 100,000 TPM | 500 RPM & 2,000,000 TPM | _trending\_up_ 5,000 RPM & 50,000,000 TPM | _ssid\_chart_ <br>depends on the input size<br>_help_ | Count the number of tokens in the input request. | POST |
| ![](data:image/svg+xml,%3csvg%20width='240'%20height='240'%20viewBox='0%200%20240%20240'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20184.388L184.388%20152.304H152.304V184.388ZM146.922%20190.885V149.613C146.922%20148.127%20148.127%20146.922%20149.613%20146.922H190.886C193.283%20146.922%20194.484%20149.821%20192.789%20151.516L151.516%20192.788C149.821%20194.484%20146.922%20193.283%20146.922%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20133.927L184.388%20101.843H152.304V133.927ZM146.922%20140.424V99.1521C146.922%2097.6657%20148.127%2096.4608%20149.613%2096.4608H190.886C193.283%2096.4608%20194.484%2099.3597%20192.789%20101.055L151.516%20142.327C149.821%20144.023%20146.922%20142.822%20146.922%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20184.806L83.4668%20152.722H51.3828V184.806ZM46.0003%20191.303V150.031C46.0003%20148.545%2047.2053%20147.34%2048.6916%20147.34H89.964C92.3616%20147.34%2093.5624%20150.239%2091.867%20151.934L50.5946%20193.206C48.8992%20194.902%2046.0003%20193.701%2046.0003%20191.303Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20184.388L133.927%20152.304H101.843V184.388ZM96.4608%20190.885V149.613C96.4608%20148.127%2097.6657%20146.922%2099.152%20146.922H140.424C142.822%20146.922%20144.023%20149.821%20142.327%20151.516L101.055%20192.788C99.3597%20194.484%2096.4608%20193.283%2096.4608%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20133.927L133.927%20101.843H101.843V133.927ZM96.4608%20140.424V99.1521C96.4608%2097.6657%2097.6657%2096.4608%2099.152%2096.4608H140.424C142.822%2096.4608%20144.023%2099.3597%20142.327%20101.055L101.055%20142.327C99.3597%20144.023%2096.4608%20142.822%2096.4608%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%2083.4664L133.927%2051.3825H101.843V83.4664ZM96.4608%2089.9637V48.6913C96.4608%2047.2049%2097.6657%2046%2099.152%2046H140.424C142.822%2046%20144.023%2048.8989%20142.327%2050.5943L101.055%2091.8667C99.3597%2093.5621%2096.4608%2092.3613%2096.4608%2089.9637Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20132.808L83.4668%20100.725H51.3828V132.808ZM46.0003%20139.306V98.0333C46.0003%2096.547%2047.2053%2095.3421%2048.6916%2095.3421H89.964C92.3616%2095.3421%2093.5624%2098.2409%2091.867%2099.9363L50.5946%20141.209C48.8992%20142.904%2046.0003%20141.703%2046.0003%20139.306Z'%20fill='white'/%3e%3cpath%20d='M190.891%2046H149.619C147.221%2046%20146.02%2048.8989%20147.716%2050.5943L188.988%2091.8667C190.683%2093.5621%20193.582%2092.3613%20193.582%2089.9637V48.6913C193.582%2047.2049%20192.377%2046%20190.891%2046Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3826%2083.4664L83.4665%2051.3825H51.3826V83.4664ZM46.0001%2089.9637V48.6913C46.0001%2047.2049%2047.205%2046%2048.6914%2046H89.9638C92.3614%2046%2093.5621%2048.8989%2091.8668%2050.5943L50.5944%2091.8667C48.899%2093.5621%2046.0001%2092.3613%2046.0001%2089.9637Z'%20fill='white'/%3e%3c/svg%3e) | Classifier API | `https://api.jina.ai/v1/train` | Train a classifier using labeled examples | _block_ | 25 RPM & 25,000 TPM | 125 RPM & 500,000 TPM | 1,250 RPM & 12,000,000 TPM | _ssid\_chart_ <br>depends on the input size | Tokens counted as: input\_tokens × num\_iters | POST |
| ![](data:image/svg+xml,%3csvg%20width='240'%20height='240'%20viewBox='0%200%20240%20240'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20184.388L184.388%20152.304H152.304V184.388ZM146.922%20190.885V149.613C146.922%20148.127%20148.127%20146.922%20149.613%20146.922H190.886C193.283%20146.922%20194.484%20149.821%20192.789%20151.516L151.516%20192.788C149.821%20194.484%20146.922%20193.283%20146.922%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20133.927L184.388%20101.843H152.304V133.927ZM146.922%20140.424V99.1521C146.922%2097.6657%20148.127%2096.4608%20149.613%2096.4608H190.886C193.283%2096.4608%20194.484%2099.3597%20192.789%20101.055L151.516%20142.327C149.821%20144.023%20146.922%20142.822%20146.922%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20184.806L83.4668%20152.722H51.3828V184.806ZM46.0003%20191.303V150.031C46.0003%20148.545%2047.2053%20147.34%2048.6916%20147.34H89.964C92.3616%20147.34%2093.5624%20150.239%2091.867%20151.934L50.5946%20193.206C48.8992%20194.902%2046.0003%20193.701%2046.0003%20191.303Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20184.388L133.927%20152.304H101.843V184.388ZM96.4608%20190.885V149.613C96.4608%20148.127%2097.6657%20146.922%2099.152%20146.922H140.424C142.822%20146.922%20144.023%20149.821%20142.327%20151.516L101.055%20192.788C99.3597%20194.484%2096.4608%20193.283%2096.4608%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20133.927L133.927%20101.843H101.843V133.927ZM96.4608%20140.424V99.1521C96.4608%2097.6657%2097.6657%2096.4608%2099.152%2096.4608H140.424C142.822%2096.4608%20144.023%2099.3597%20142.327%20101.055L101.055%20142.327C99.3597%20144.023%2096.4608%20142.822%2096.4608%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%2083.4664L133.927%2051.3825H101.843V83.4664ZM96.4608%2089.9637V48.6913C96.4608%2047.2049%2097.6657%2046%2099.152%2046H140.424C142.822%2046%20144.023%2048.8989%20142.327%2050.5943L101.055%2091.8667C99.3597%2093.5621%2096.4608%2092.3613%2096.4608%2089.9637Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20132.808L83.4668%20100.725H51.3828V132.808ZM46.0003%20139.306V98.0333C46.0003%2096.547%2047.2053%2095.3421%2048.6916%2095.3421H89.964C92.3616%2095.3421%2093.5624%2098.2409%2091.867%2099.9363L50.5946%20141.209C48.8992%20142.904%2046.0003%20141.703%2046.0003%20139.306Z'%20fill='white'/%3e%3cpath%20d='M190.891%2046H149.619C147.221%2046%20146.02%2048.8989%20147.716%2050.5943L188.988%2091.8667C190.683%2093.5621%20193.582%2092.3613%20193.582%2089.9637V48.6913C193.582%2047.2049%20192.377%2046%20190.891%2046Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3826%2083.4664L83.4665%2051.3825H51.3826V83.4664ZM46.0001%2089.9637V48.6913C46.0001%2047.2049%2047.205%2046%2048.6914%2046H89.9638C92.3614%2046%2093.5621%2048.8989%2091.8668%2050.5943L50.5944%2091.8667C48.899%2093.5621%2046.0001%2092.3613%2046.0001%2089.9637Z'%20fill='white'/%3e%3c/svg%3e) | Classifier API (Few-shot) | `https://api.jina.ai/v1/classify` | Classify inputs using a trained few-shot classifier | _block_ | 25 RPM & 25,000 TPM | 125 RPM & 500,000 TPM | 1,250 RPM & 12,000,000 TPM | _ssid\_chart_ <br>depends on the input size | Tokens counted as: input\_tokens | POST |
| ![](data:image/svg+xml,%3csvg%20width='240'%20height='240'%20viewBox='0%200%20240%20240'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20184.388L184.388%20152.304H152.304V184.388ZM146.922%20190.885V149.613C146.922%20148.127%20148.127%20146.922%20149.613%20146.922H190.886C193.283%20146.922%20194.484%20149.821%20192.789%20151.516L151.516%20192.788C149.821%20194.484%20146.922%20193.283%20146.922%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M152.304%20133.927L184.388%20101.843H152.304V133.927ZM146.922%20140.424V99.1521C146.922%2097.6657%20148.127%2096.4608%20149.613%2096.4608H190.886C193.283%2096.4608%20194.484%2099.3597%20192.789%20101.055L151.516%20142.327C149.821%20144.023%20146.922%20142.822%20146.922%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20184.806L83.4668%20152.722H51.3828V184.806ZM46.0003%20191.303V150.031C46.0003%20148.545%2047.2053%20147.34%2048.6916%20147.34H89.964C92.3616%20147.34%2093.5624%20150.239%2091.867%20151.934L50.5946%20193.206C48.8992%20194.902%2046.0003%20193.701%2046.0003%20191.303Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20184.388L133.927%20152.304H101.843V184.388ZM96.4608%20190.885V149.613C96.4608%20148.127%2097.6657%20146.922%2099.152%20146.922H140.424C142.822%20146.922%20144.023%20149.821%20142.327%20151.516L101.055%20192.788C99.3597%20194.484%2096.4608%20193.283%2096.4608%20190.885Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%20133.927L133.927%20101.843H101.843V133.927ZM96.4608%20140.424V99.1521C96.4608%2097.6657%2097.6657%2096.4608%2099.152%2096.4608H140.424C142.822%2096.4608%20144.023%2099.3597%20142.327%20101.055L101.055%20142.327C99.3597%20144.023%2096.4608%20142.822%2096.4608%20140.424Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M101.843%2083.4664L133.927%2051.3825H101.843V83.4664ZM96.4608%2089.9637V48.6913C96.4608%2047.2049%2097.6657%2046%2099.152%2046H140.424C142.822%2046%20144.023%2048.8989%20142.327%2050.5943L101.055%2091.8667C99.3597%2093.5621%2096.4608%2092.3613%2096.4608%2089.9637Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3828%20132.808L83.4668%20100.725H51.3828V132.808ZM46.0003%20139.306V98.0333C46.0003%2096.547%2047.2053%2095.3421%2048.6916%2095.3421H89.964C92.3616%2095.3421%2093.5624%2098.2409%2091.867%2099.9363L50.5946%20141.209C48.8992%20142.904%2046.0003%20141.703%2046.0003%20139.306Z'%20fill='white'/%3e%3cpath%20d='M190.891%2046H149.619C147.221%2046%20146.02%2048.8989%20147.716%2050.5943L188.988%2091.8667C190.683%2093.5621%20193.582%2092.3613%20193.582%2089.9637V48.6913C193.582%2047.2049%20192.377%2046%20190.891%2046Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M51.3826%2083.4664L83.4665%2051.3825H51.3826V83.4664ZM46.0001%2089.9637V48.6913C46.0001%2047.2049%2047.205%2046%2048.6914%2046H89.9638C92.3614%2046%2093.5621%2048.8989%2091.8668%2050.5943L50.5944%2091.8667C48.899%2093.5621%2046.0001%2092.3613%2046.0001%2089.9637Z'%20fill='white'/%3e%3c/svg%3e) | Classifier API (Zero-shot) | `https://api.jina.ai/v1/classify` | Classify inputs using zero-shot classification | _block_ | 25 RPM & 25,000 TPM | 125 RPM & 500,000 TPM | 1,250 RPM & 12,000,000 TPM | _ssid\_chart_ <br>depends on the input size | Tokens counted as: input\_tokens + label\_tokens | POST |
| ![](data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20width='320'%20zoomAndPan='magnify'%20viewBox='0%200%20240%20239.999995'%20height='320'%20preserveAspectRatio='xMidYMid%20meet'%20version='1.0'%3e%3cpath%20fill='%23ffffff'%20d='M%20132.328125%2039%20L%20144.652344%2060.351562%20L%20132.328125%2081.699219%20L%20107.675781%2081.699219%20L%2095.347656%2060.351562%20L%20107.675781%2039%20Z%20M%20184.96875%2058.523438%20L%20202%2088.023438%20L%20184.96875%20117.527344%20L%20153.011719%20117.527344%20L%20138.085938%20143.375%20L%20154.066406%20171.050781%20L%20137.03125%20200.554688%20L%20102.964844%20200.554688%20L%2085.933594%20171.050781%20L%20101.910156%20143.375%20L%2086.988281%20117.527344%20L%2055.03125%20117.527344%20L%2038%2088.027344%20L%2055.03125%2058.523438%20L%2089.097656%2058.523438%20L%20105.074219%2086.199219%20L%20134.921875%2086.199219%20L%20150.902344%2058.523438%20Z%20M%2057.140625%20113.875%20L%2086.988281%20113.875%20L%20101.914062%2088.023438%20L%2086.988281%2062.175781%20L%2057.140625%2062.175781%20L%2042.21875%2088.027344%20Z%20M%20105.074219%20141.550781%20L%2090.152344%20115.703125%20L%20105.078125%2089.851562%20L%20134.921875%2089.851562%20L%20149.847656%20115.699219%20L%20134.925781%20141.550781%20Z%20M%20138.085938%2088.023438%20L%20153.011719%2062.175781%20L%20182.859375%2062.175781%20L%20197.78125%2088.023438%20L%20182.859375%20113.875%20L%20153.011719%20113.875%20Z%20M%20105.074219%20145.203125%20L%2090.152344%20171.050781%20L%20105.074219%20196.902344%20L%20134.921875%20196.902344%20L%20149.847656%20171.050781%20L%20134.921875%20145.203125%20Z%20M%2096.71875%20143.375%20L%2084.390625%20122.027344%20L%2059.738281%20122.027344%20L%2047.414062%20143.375%20L%2059.738281%20164.726562%20L%2084.390625%20164.726562%20Z%20M%20192.585938%20143.375%20L%20180.261719%20122.023438%20L%20155.605469%20122.023438%20L%20143.28125%20143.375%20L%20155.605469%20164.726562%20L%20180.261719%20164.726562%20Z%20M%20192.585938%20143.375%20'%20fill-opacity='1'%20fill-rule='evenodd'/%3e%3c/svg%3e) | Segmenter API | `https://api.jina.ai/v1/segment` | Tokenize and segment long text | 20 RPM | 200 RPM | 200 RPM | 1,000 RPM | 0.3s | Token is not counted as usage. | GET/POST |
| ![](data:image/svg+xml,%3csvg%20width='240'%20height='240'%20viewBox='0%200%20240%20240'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M123.395%20131.064L162.935%20102.948L154.175%2087.776L123.395%20131.064ZM146.664%2074.7669L121.428%20129.927L129.479%2045.0007L146.664%2074.7669ZM117.189%20137.27L36%20195H76.1387L117.189%20137.27ZM93.2635%20195L119.156%20138.405L113.791%20195H93.2635ZM177.409%20128.018L124.531%20133.031L168.649%20112.846L177.409%20128.018ZM38.4785%20170.794L116.053%20135.302L55.6643%20141.027L38.4785%20170.794ZM184.92%20141.027L202.105%20170.793L124.531%20135.302L184.92%20141.027ZM116.053%20133.031L63.1751%20128.018L71.9347%20112.846L116.053%20133.031ZM123.395%20137.269L204.584%20195H164.446L123.395%20137.269ZM77.6493%20102.948L117.189%20131.063L86.4089%2087.7758L77.6493%20102.948ZM121.428%20138.406L126.793%20195H147.321L121.428%20138.406ZM119.156%20129.927L93.9197%2074.7667L111.105%2045L119.156%20129.927Z'%20fill='white'/%3e%3c/svg%3e) | DeepSearch | `https://deepsearch.jina.ai/v1/chat/completions` | Reason, search and iterate to find the best answer | _block_ | 50 RPM | 50 RPM | 500 RPM | 56.7s | Count the total number of tokens in the whole process. | POST |

API-related common questions

_code_

Can I use the same API key for reader, embedding, reranking, classifying and fine-tuning APIs?

_keyboard\_arrow\_down_

Yes, the same API key is valid for all search foundation products from Jina AI. This includes the reader, embedding, reranking, classifying and fine-tuning APIs, with tokens shared between the all services.

_code_

Can I monitor the token usage of my API key?

_keyboard\_arrow\_down_

Yes, token usage can be monitored in the 'API Key & Billing' tab by entering your API key, allowing you to view the recent usage history and remaining tokens. If you have logged in to the API dashboard, these details can also be viewed in the 'Manage API Key' tab.

_code_

What should I do if I forget my API key?

_keyboard\_arrow\_down_

If you have misplaced a topped-up key and wish to retrieve it, please contact support AT jina.ai with your registered email for assistance. It's recommended to log in to keep your API key securely stored and easily accessible.

[Contact](https://jina.ai/contact-sales)

_code_

Do API keys expire?

_keyboard\_arrow\_down_

No, our API keys do not have an expiration date. However, if you suspect your key has been compromised and wish to retire it, please contact our support team for assistance. You can also revoke your key in [the API Key Management dashboard](https://jina.ai/api-dashboard).

[Contact](https://jina.ai/contact-sales)

_code_

Can I transfer tokens between API keys?

_keyboard\_arrow\_down_

Yes, you can transfer tokens from a premium key to another. After logging into your account on [the API Key Management dashboard](https://jina.ai/api-dashboard), use the settings of the key you want to transfer out to move all remaining paid tokens.

_code_

Can I revoke my API key?

_keyboard\_arrow\_down_

Yes, you can revoke your API key if you believe it has been compromised. Revoking a key will immediately disable it for all users who have stored it, and all remaining balance and associated properties will be permanently unusable. If the key is a premium key, you have the option to transfer the remaining paid balance to another key before revocation. Notice that this action cannot be undone. To revoke a key, go to the key settings in [the API Key Management dashboard](https://jina.ai/api-dashboard).

_code_

Why is the first request for some models slow?

_keyboard\_arrow\_down_

This is because our serverless architecture offloads certain models during periods of low usage. The initial request activates or 'warms up' the model, which may take a few seconds. After this initial activation, subsequent requests process much more quickly.

_code_

Is my API data used to train your models?

_keyboard\_arrow\_down_

No. We never use your API requests, inputs, or outputs to train our embedding, reranker, or any other models. Your data remains yours.

_code_

What are the rate limits for Jina APIs?

_keyboard\_arrow\_down_

Rate limits apply per API key:

**Free:** 100 RPM, 100K TPM, 2 concurrent requests

**Paid:** 500 RPM, 2M TPM, 50 concurrent requests

**Premium:** 5,000 RPM, 50M TPM, 500 concurrent requests

There is also an IP-based rate limit of 10,000 requests per 60 seconds. These limits apply across all Jina APIs (Embeddings, Reranker, Reader, etc.).

_code_

Are there batch size limits for the APIs?

_keyboard\_arrow\_down_

There is **no batch size limit** for either the Embeddings or Reranker APIs. You can send as many items or documents as needed per request. Both APIs batch inputs internally by token count for optimal GPU utilization.

Billing-related common questions

_attach\_money_

Is billing based on the number of sentences or requests?

_keyboard\_arrow\_down_

Our pricing model is based on the total number of tokens processed, allowing users the flexibility to allocate these tokens across any number of sentences, offering a cost-effective solution for diverse text analysis requirements.

_attach\_money_

Is there a free trial available for new users?

_keyboard\_arrow\_down_

We offer a welcoming free trial to new users, which includes ten millions tokens for use with any of our models, facilitated by an auto-generated API key. Once the free token limit is reached, users can easily purchase additional tokens for their API keys via the 'Buy tokens' tab.

_attach\_money_

Are tokens charged for failed requests?

_keyboard\_arrow\_down_

No, tokens are not deducted for failed requests.

_attach\_money_

What payment methods are accepted?

_keyboard\_arrow\_down_

Payments are processed through Stripe, supporting a variety of payment methods including credit cards, Google Pay, and PayPal for your convenience.

_attach\_money_

Is invoicing available for token purchases?

_keyboard\_arrow\_down_

Yes, an invoice will be issued to the email address associated with your Stripe account upon the purchase of tokens.

Search Foundation

[Reader](https://jina.ai/reader) [Embeddings](https://jina.ai/embeddings) [Reranker](https://jina.ai/reranker) [Elastic Inference Service\\
\\
_open\_in\_new_](https://www.elastic.co/docs/explore-analyze/elastic-inference/eis)

Get Jina API key

[Rate Limit](https://jina.ai/contact-sales#rate-limit) [API Status](https://status.jina.ai/)

Terms

[Security](https://jina.ai/legal#security-as-company-value) [Terms & Conditions](https://jina.ai/legal/#terms-and-conditions) [Privacy](https://jina.ai/legal/#privacy-policy)

Manage Cookies

Do Not Sell or Share My Personal Information
[Download Jina logo\\
\\
_open\_in\_new_](https://jina.ai/logo-Jina-1024.zip) [Download Elastic logo\\
\\
_open\_in\_new_](https://brand.elastic.co/302f66895/p/06c73c-elastic-logos/b/35d033)

[_![](https://jina.ai/huggingface_logo.svg)_](https://huggingface.co/jinaai)

Elastic © 2020-2026.

This website and all associated content, software, products, and services are intended for professional use only. No consumer use is intended or directed.
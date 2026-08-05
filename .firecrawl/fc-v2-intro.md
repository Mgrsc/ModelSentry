> ## Documentation Index
>
> Fetch the complete documentation index at: [/llms.txt](https://docs.firecrawl.dev/llms.txt)
>
> Use this file to discover all available pages before exploring further.

[Skip to main content](https://docs.firecrawl.dev/api-reference/v2-introduction#content-area)

**For AI agents:** Use [llms.txt](https://docs.firecrawl.dev/llms.txt) for a full index of all documentation.

The Firecrawl API gives you programmatic access to web data. All endpoints share a common base URL, authentication scheme, and response format described on this page.

## [​](https://docs.firecrawl.dev/api-reference/v2-introduction\#features)  Features

[**Search** \\
\\
Search the web and get full page content in any format.](https://docs.firecrawl.dev/api-reference/endpoint/search)

[**Scrape** \\
\\
Extract content from any webpage in markdown or json format.](https://docs.firecrawl.dev/api-reference/endpoint/scrape)

[**Interact** \\
\\
Create an Interact session to click, fill forms, and navigate pages.](https://docs.firecrawl.dev/api-reference/endpoint/browser-create)

[**Parse** \\
\\
Upload files and parse them into markdown or other formats.](https://docs.firecrawl.dev/api-reference/endpoint/parse)

[**Monitor** \\
\\
Schedule recurring checks and get notified when content changes.](https://docs.firecrawl.dev/api-reference/endpoint/monitor-create)

[**Crawl** \\
\\
Crawl entire websites and get content from all pages.](https://docs.firecrawl.dev/api-reference/endpoint/crawl-post)

[**Map** \\
\\
Get a complete list of URLs from any website quickly and reliably.](https://docs.firecrawl.dev/api-reference/endpoint/map)

[**Agent** \\
\\
Autonomous web data gathering powered by AI.](https://docs.firecrawl.dev/api-reference/endpoint/agent)

## [​](https://docs.firecrawl.dev/api-reference/v2-introduction\#base-url)  Base URL

All requests use the following base URL:

```
https://api.firecrawl.dev
```

## [​](https://docs.firecrawl.dev/api-reference/v2-introduction\#authentication)  Authentication

Every request requires an `Authorization` header with your API key:

```
Authorization: Bearer fc-YOUR-API-KEY
```

Include this header in all API calls. You can find your API key in the [Firecrawl dashboard](https://www.firecrawl.dev/app/api-keys).If you are an agent without an API key, start with [Get credentials](https://docs.firecrawl.dev/ai-onboarding#get-credentials). If your platform supports WorkOS ID-JAG, use [`auth.md`](https://www.firecrawl.dev/auth.md) for registration instructions.

cURL

Python

Node

```
curl -X POST "https://api.firecrawl.dev/v2/scrape" \
  -H "Authorization: Bearer fc-YOUR-API-KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

```
from firecrawl import Firecrawl

firecrawl = Firecrawl(api_key="fc-YOUR-API-KEY")

result = firecrawl.scrape("https://example.com")
```

```
import { Firecrawl } from 'firecrawl';

const firecrawl = new Firecrawl({ apiKey: "fc-YOUR-API-KEY" });

const result = await firecrawl.scrape('https://example.com');
```

## [​](https://docs.firecrawl.dev/api-reference/v2-introduction\#response-codes)  Response codes

Firecrawl uses conventional HTTP status codes to indicate the outcome of your requests. Codes in the `2xx` range indicate success, `4xx` codes indicate client errors, and `5xx` codes indicate server errors.See [Errors](https://docs.firecrawl.dev/api-reference/errors) for the full reference, including the `error` string returned for each failure mode, retry guidance, and a copy-pasteable backoff snippet.

## [​](https://docs.firecrawl.dev/api-reference/v2-introduction\#429-responses)  429 responses

When you exceed your plan’s rate or concurrency limits, the API returns a `429` status code. See [Rate Limits](https://docs.firecrawl.dev/rate-limits) for per-plan limits and [Errors](https://docs.firecrawl.dev/api-reference/errors) for retry guidance.

[Suggest edits](https://github.com/firecrawl/firecrawl-docs/edit/main/api-reference/v2-introduction.mdx) [Raise issue](https://github.com/firecrawl/firecrawl-docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/v2-introduction)

Ctrl+I

✕
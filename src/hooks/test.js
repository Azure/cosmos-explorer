fetch("https://main.documentdb.ext.azure.com/api/cassandra/keys", {
  headers: {
    accept: "*/*",
    "accept-language": "en",
    authorization:
      "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Im5PbzNaRHJPRFhFSzFqS1doWHNsSFJfS1hFZyIsImtpZCI6Im5PbzNaRHJPRFhFSzFqS1doWHNsSFJfS1hFZyJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuYXp1cmUuY29tLyIsImlzcyI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzcyZjk4OGJmLTg2ZjEtNDFhZi05MWFiLTJkN2NkMDExZGI0Ny8iLCJpYXQiOjE2MTU0ODMzNDAsIm5iZiI6MTYxNTQ4MzM0MCwiZXhwIjoxNjE1NDg3MjQwLCJhY3IiOiIxIiwiYWlvIjoiQWFRQVcvOFRBQUFBbjdpdko0WVhhSW1UeFZLbSt2enY5QjZpUUp6U3J6Z1NJZFBvMmcvbDZReHd0Q2JtNmVabTRkTFd5eXFCN3JxN0tRZ1FmaHRESHFGblMwSnpvOVluQStIb2xLMVVJeURDYzByaTRwVDRZbUI3UUF6R1lIYi9IWVVFWHozdkxTeXdiNVpBbDZRQlFWUktKQmh3R1F5MEJFNlk3Q25YZlpBTE5kNFE3Y3oweklvVmdmQTdwV3d6RzlBWXAxM1QyL0wwYjlWUjdCZ2E1QWpFOWw4a1BBVGI5Zz09IiwiYW1yIjpbInJzYSIsIm1mYSJdLCJhcHBpZCI6IjIwM2YxMTQ1LTg1NmEtNDIzMi04M2Q0LWE0MzU2OGZiYTIzZCIsImFwcGlkYWNyIjoiMCIsImRldmljZWlkIjoiMzI3NjNiYjktMDNlNS00ZDBkLTliZmEtZmEyY2U5OGQ1ZGVlIiwiZmFtaWx5X25hbWUiOiJGYXVsa25lciIsImdpdmVuX25hbWUiOiJTdGV2ZSIsImhhc2dyb3VwcyI6InRydWUiLCJpcGFkZHIiOiI0NS4yMi4xMjIuMjIwIiwibmFtZSI6IlN0ZXZlIEZhdWxrbmVyIiwib2lkIjoiN2M4Yjk4ZGItOTA3OC00NGM3LWE5YWItYzJiOGYxOGRiZDM2Iiwib25wcmVtX3NpZCI6IlMtMS01LTIxLTIxMjc1MjExODQtMTYwNDAxMjkyMC0xODg3OTI3NTI3LTMyMjM1ODIxIiwicHVpZCI6IjEwMDM3RkZFQUJDNTk0QjYiLCJyaCI6IjAuQVJvQXY0ajVjdkdHcjBHUnF5MTgwQkhiUjBVUlB5QnFoVEpDZzlTa05XajdvajBhQUprLiIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsInN1YiI6InNJV3JwSTFoQVNUWXJoUFVrYWp1NUtQb3Z6SHdzUkdnOTN3U2t1OEs0aW8iLCJ0aWQiOiI3MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDciLCJ1bmlxdWVfbmFtZSI6InN0ZmF1bEBtaWNyb3NvZnQuY29tIiwidXBuIjoic3RmYXVsQG1pY3Jvc29mdC5jb20iLCJ1dGkiOiJKOXdGaXgxN3RFYU5uZzhVckROUEFBIiwidmVyIjoiMS4wIiwieG1zX3RjZHQiOjEyODkyNDE1NDd9.asA8SB1f7W8SjYtbgqpc-wgGMITDcrmhwg1t-ZSBCTm9zVdLPRBTYK8Qbra39Na3RPAIA15CEwLE5OptIN3La1xx3rijKGxvvhlzPZ7bP2-NbpzAiUCDdHK9WxjoB_q-3WrfnFXEoe57fHKXI_o9gFLd1075Xj5fMDNtOIacF2sFOjumOUZKTJWaKnJ9zr7yJjl0VdP1pOLmg72cxZHSuOFGfj3Xp4L5jCfG5r9pz90ECpM3TMI3IHMqAaozC8-SE_RstHqyuBEhaCvKrCTn869XfdijY2EKYk6I1kCXfKOaQ5MKQNxoCzHqQYKNKrcSO3PNDV1aoBLERtwNoCEfLw",
    "cache-control": "no-cache",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    pragma: "no-cache",
    "sec-ch-ua": '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
  },
  referrer: "https://cosmos.azure.com/",
  referrerPolicy: "strict-origin-when-cross-origin",
  method: "POST",
  mode: "cors",
  credentials: "include",
});

fetch("https://localhost:1234/proxy/api/cassandra/keys", {
  headers: {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    authorization:
      "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Im5PbzNaRHJPRFhFSzFqS1doWHNsSFJfS1hFZyIsImtpZCI6Im5PbzNaRHJPRFhFSzFqS1doWHNsSFJfS1hFZyJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldCIsImlzcyI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzcyZjk4OGJmLTg2ZjEtNDFhZi05MWFiLTJkN2NkMDExZGI0Ny8iLCJpYXQiOjE2MTU0ODI5NDYsIm5iZiI6MTYxNTQ4Mjk0NiwiZXhwIjoxNjE1NTY5NjQ2LCJhaW8iOiJFMlpnWUZpU3NUVG13U1VYaHlmYVdldVhQdGN1QVFBPSIsImFwcGlkIjoiZmQ4NzUzYjAtMDcwNy00ZTMyLTg0ZTktMjUzMmFmODY1ZmI0IiwiYXBwaWRhY3IiOiIxIiwiaWRwIjoiaHR0cHM6Ly9zdHMud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3LyIsIm9pZCI6IjY5NGE3NjQ5LTFjYzQtNDk5ZS1iNTIwLTFjMTY4NWNmODViOSIsInJoIjoiMC5BUm9BdjRqNWN2R0dyMEdScXkxODBCSGJSN0JUaF8wSEJ6Sk9oT2tsTXEtR1g3UWFBQUEuIiwic3ViIjoiNjk0YTc2NDktMWNjNC00OTllLWI1MjAtMWMxNjg1Y2Y4NWI5IiwidGlkIjoiNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3IiwidXRpIjoibUhrQVdIcHhZMEswcnJ3amZ1c1ZBQSIsInZlciI6IjEuMCIsInhtc190Y2R0IjoxMjg5MjQxNTQ3fQ.GgOPiDWivSLq5QgXpDkiTWZxVSWDbE7tktorLuPpiUQS_tt5xNc_FLnJur2upbBRGeLw01hxEk4aCi5aA7lwcEx3yjefjUdYYYjxfmjnvfBuAsCZJ4JpOJv-vZ0Ym3HHH036tKv_KNC8bJgNXH_aLxDZIImI8dVgfmzALPFs0NGw36GRG2GKg55LNhzaqalZ4rZFIKas5M3VXqMjGsx3plpI5CnJAAIV5YrxXdAv02yV4Ui0CQL1Nu2XUG4jCRLM8YI0lrBzD6aEbnSY8tA2LFyAa8cA2yKZrnL3NOCe8VL1NfMhIljTbR5lVl5RmfEPxkX067GgAcA2fsC42skulg",
    "cache-control": "no-cache",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    pragma: "no-cache",
    "sec-ch-ua": '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest",
  },
  referrer: "https://localhost:1234/explorer.html?platform=Portal&disablePortalInitCache",
  referrerPolicy: "strict-origin-when-cross-origin",
  method: "POST",
  mode: "cors",
  credentials: "include",
});

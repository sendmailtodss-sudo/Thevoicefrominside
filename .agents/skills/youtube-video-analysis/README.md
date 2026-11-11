# Executable video evidence skill

Python 3.10+; ffmpeg/ffprobe on PATH. Install the official URL extractor with:

```sh
python -m pip install --index-url https://pypi.org/simple -r requirements.txt
```

Optional contact sheets: `python -m pip install --index-url https://pypi.org/simple -r requirements-contact.txt`.
Run `python scripts/video_evidence.py doctor` and `python -m unittest discover -s tests -v`.

`inspect` supports authorized local video that ffmpeg can decode, including files unrelated to YouTube. `url` uses normal public HTTPS extraction for supported yt-dlp sites/direct videos. It does not grant access, log in or bypass a network/content restriction. Exit codes: 0 completed evidence operation; 2 invalid input/tool failure; 3 public source blocked/failed. Inspect the status in the report rather than relying on a file existing.

The manifest contains source hash/metadata, actual decoded PTS, per-artifact SHA-256, sampling windows and separate inspection/playback/audio flags. Never-overwrite output directories prevent silently replacing evidence. `--access-report` binds downloaded-source provenance by hash. A source changing during extraction or an artifact changing before inspection attestation fails validation.

Controls: at most64 sampled frames, window radius0–5s, bounded7200s source duration and512MiB aggregate remote media payload (progress-callback granularity, HTTP overhead excluded), no live streams, no playlist, no external paid API. Contact sheets are optional; PNG frame extraction and silent adjacent MP4 creation work without Pillow. The helper deliberately does not generate semantic descriptions or transcribe audio. An analysis requires actual visual inspection by the assistant/operator.

Tests write only synthetic local media in temporary directories. The URL metadata-filter test uses a controlled response solely to check secret handling/provenance; actual network access must be checked independently. See SKILL.md for the required honest reporting workflow.

Public URL checks reject credentials, local/trailing-dot hosts and legacy numeric loopback addresses. They are not a replacement for environment-wide redirect/DNS egress controls; do not expose this local helper as an unrestricted public URL-fetch service.

# Car Picker

A Python Flask web app that helps people choose a car from their preferences, from enthusiast cars to normal daily-driver sedans.

## Features

- Browser interface built in Python with Flask
- Single-choice dropdown filters with a `No preference` option
- Decade-based year matching with production overlap support
- Exact matches, honorable mentions, and more options
- Mixed catalog with enthusiast cars and regular cars like Accord and Camry
- Car photos with direct image pins for models that need generation-specific or market-specific images

## Run locally

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

## Project structure

```text
app.py
car_picker/
  app.py
  data.py
  logic.py
  templates/
    index.html
  static/
    styles.css
requirements.txt
Procfile
render.yaml
README.md
```

## Upload to GitHub

If Git is installed, run these commands from the project folder:

```bash
cd "C:\Users\levan\OneDrive\Рабочий стол\Codex"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Replace:

- `YOUR_USERNAME`
- `YOUR_REPO`

If Git is not installed yet, install it from:

- [Git for Windows](https://git-scm.com/download/win)

Or create a repo on GitHub and upload the files manually through the website.

## Share It Without PowerShell

Running `python app.py` is normal for local development.

If you want other people to use the app through a normal link, host it online.

## Deploy on Render

This repo is already prepared for Render:

- `requirements.txt` includes `gunicorn`
- `Procfile` is included
- `render.yaml` is included

### Deploy steps

1. Push this project to GitHub
2. Sign in to [Render](https://render.com/)
3. Create a new Web Service
4. Connect your GitHub repository
5. Render should detect the Python app automatically
6. Deploy

Your app will get a public URL like:

```text
https://your-app-name.onrender.com
```

## Matching logic

- Any filter left on `No preference` is ignored
- Cars matching all selected criteria go into the main recommendations
- If there are no perfect matches, the app shows the closest available matches
- Honorable mentions are near misses
- More options continue down into looser matches
- Decade filters include cars whose production years overlap the selected decade

## Notes

- The car database is currently curated by hand in `car_picker/data.py`
- Some model photos are pinned directly because automatic page-level images can be wrong for certain trims, generations, or market-specific cars

## Good next upgrades

- Move the car catalog into JSON
- Add more economy cars, wagons, SUVs, and luxury sedans
- Add tags like `reliable`, `luxury`, `economy`, `track`, `drift`, and `tuner`
- Add admin-friendly tools for updating the catalog

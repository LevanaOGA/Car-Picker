from flask import Flask, render_template, request

from .data import QUESTIONS, get_default_answers
from .logic import build_results


def create_app():
    app = Flask(__name__)

    @app.route("/", methods=["GET", "POST"])
    def index():
        answers = get_default_answers()
        results = None

        if request.method == "POST":
            for question in QUESTIONS:
                answers[question["id"]] = request.form.get(question["id"], "no_preference")
            results = build_results(answers)

        return render_template(
            "index.html",
            questions=QUESTIONS,
            answers=answers,
            results=results,
        )

    return app

FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PORT=5001

EXPOSE 5001

CMD ["python", "app.py"]

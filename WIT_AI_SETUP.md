# Wit.ai Setup Guide for Yoom AI

## Step 1: Create App
1. Go to https://wit.ai and log in with GitHub or Facebook
2. Click "New App"
3. Name it "yoom-lecture-ai"
4. Language: English
5. Click "Create"

## Step 2: Train Intents
Go to your app → "Utterances" and add these training examples:

### Intent: start_recording
- "start recording the lecture"
- "begin recording"
- "record this session"
- "can you record this"

### Intent: stop_recording
- "stop recording"
- "end recording"
- "stop the recording now"

### Intent: show_poll
- "let's do a quick poll"
- "I want to ask the class a question"
- "create a poll"
- "poll the students"

### Intent: create_quiz
- "let's test your knowledge"
- "quiz time"
- "create a quiz question"
- "I want to quiz the class"

### Intent: assign_homework
- "your homework for this week"
- "assignment for next class"
- "I'm assigning homework"
- "homework due Friday"

### Intent: summarize_lecture
- "summarize what we covered"
- "create a summary of today's lecture"
- "generate lecture notes"
- "summarize this lecture"

### Intent: mute_all
- "everyone please mute"
- "mute all participants"
- "can everyone go on mute"

## Step 3: Train the Model
Click "Train and Validate" after adding utterances.
Wait for training to complete (usually < 2 minutes).

## Step 4: Get Token
Go to Settings → Server Access Token → Copy it
Paste into your .env.local as WIT_AI_TOKEN=your_token_here

## Step 5: Test
In Wit.ai dashboard → Understanding → type "start recording"
Confirm it returns intent: start_recording with confidence > 0.7

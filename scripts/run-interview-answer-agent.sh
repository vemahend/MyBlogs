#!/bin/zsh

export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Users/deepalimehra/.vscode/extensions/openai.chatgpt-26.810.52044-darwin-arm64/bin/macos-aarch64"
cd /Users/deepalimehra/Downloads/MyBlogs/MyBlogs || exit 1

while true; do
  /usr/local/bin/node scripts/interview-answer-agent.mjs >> Interview_Answers/generation.log 2>&1
  result=$?

  if [[ $result -eq 0 ]]; then
    print "$(date '+%Y-%m-%d %H:%M:%S') Generation and final validation completed." >> Interview_Answers/generation.log
    exit 0
  fi

  print "$(date '+%Y-%m-%d %H:%M:%S') Worker exited with status $result; retrying in 60 seconds." >> Interview_Answers/generation.log
  sleep 60
done

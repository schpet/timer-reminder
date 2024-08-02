install:
    npm run package
    vsce package --allow-missing-repository -o timer-reminder-dev.vsix
    code --install-extension timer-reminder-dev.vsix

publish:
    npm run package
    vsce publish

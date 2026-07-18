INSTALLATION


1. Download fx-autoconfig
Go to github.com/MrOtherGuy/fx-autoconfig → Code → Download ZIP, then unzip it somewhere. Inside you'll see two folders: program and profile.

2. Install the "program" part (into Zen's install folder)

Windows: Zen is usually at C:\Program Files\Zen Browser\. Copy config.js and the defaults folder from fx-autoconfig's program folder into it, so config.js sits right next to zen.exe.

macOS: Copy config.js and defaults into /Applications/Zen.app/Contents/Resources/.

Linux: Copy config.js and defaults into wherever the zen binary lives (e.g. /opt/zen-browser/, /usr/lib/zen-browser/ — 

3. Install the "profile" part (into your Zen profile)
This is the part that actually does something.

Open Zen → type about:support into URL → click Open Profile Folder. (alternatively type about:profiles in the URL and follow the directory of the Default (release) )

Copy the contents of fx-autoconfig's profile folder (not the folder itself) into that profile folder. You should end up with a chrome folder there containing JS, resources, and utils subfolders. If a chrome folder already exists (e.g. from a userChrome.css setup), just merge them.

4. Add the lock-tab script

Drop lockTab.uc.js into chrome/JS/.

5. Clear the startup cache and restart

Go to about:support again.
Click Clear Startup Cache… (top right) and confirm — this forces Zen to pick up the new loader.
Zen will restart automatically.

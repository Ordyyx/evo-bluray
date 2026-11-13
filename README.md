# Evo Blu-ray Library

The library is a static website. You edit your collection in VS Code, and GitHub Pages publishes it at [bluray.coasterevo.com](https://bluray.coasterevo.com). The site includes 154 titles imported from your Website Collection CSV. Covers are stored as WebP files in `assets/covers/`, so visitors load them directly from the site. To add a new title, use an existing entry in `collection.json` as a template.

## 1. Open and preview the project

1. Install [Visual Studio Code](https://code.visualstudio.com/) if you need it.
2. In VS Code choose **File → Open Folder…** and open `/Users/ethanredfern/Documents/ChatGPT/EvoBluRay`.
3. Choose **Terminal → New Terminal** and run:

   ```sh
   python3 -m http.server 8765 --bind 127.0.0.1
   ```

4. Open [the local library](http://127.0.0.1:8765/). If the terminal says the port is already in use, try opening that link first. Refresh the browser after saving your edits. Press **Control-C** in the terminal when you want to stop the preview.

[VS Code terminal guide](https://code.visualstudio.com/docs/terminal/getting-started)

## 2. Save artwork for a new title

### One-time setup

Open another VS Code terminal with **Terminal → New Terminal** so the preview can keep running. Run these two commands from the project folder:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r scripts/requirements.txt
```

This installs Pillow, the image converter, in the project's local Python environment. Git ignores the `.venv` folder.

### For a new cover

1. If you already have a cover image, skip to the local-file command in step 3. For an Apple TV cover, open [Ben Dodson’s Apple TV artwork finder](https://bendodson.com/projects/apple-tv-movies-artwork-finder/). Choose **Movies**, pick **United Kingdom** if that’s your storefront, then search for the film and check the year.
2. Open the portrait artwork for the correct result in its own tab. Copy the direct image address from the address bar. It will be an HTTPS address on Apple’s `mzstatic.com` CDN. You can also save the picture from that tab and use the file from Downloads.
3. In the VS Code terminal, run the command below. Change `interstellar-2014` to a unique lowercase ID for your film, then replace the placeholder inside the quotes with the direct image address.

   ```sh
   .venv/bin/python scripts/cover.py interstellar-2014 'PASTE-APPLE-IMAGE-ADDRESS-HERE'
   ```

   If you downloaded the image yourself, use its file path instead:

   ```sh
   .venv/bin/python scripts/cover.py interstellar-2014 "$HOME/Downloads/interstellar.jpg"
   ```

4. The command prints the path to paste into `collection.json`, for example `assets/covers/interstellar-2014.webp`. Running it again with the same film ID replaces that cover. The converter keeps the original image proportions and caps the dimensions at 720 × 1080 pixels. The site serves the finished WebP from GitHub Pages.
5. Use artwork you have permission to publish. The collection list shows a small poster next to each title.

[Apple artwork finder and instructions](https://bendodson.com/projects/apple-tv-movies-artwork-finder/) · [Blu-ray packaging dimensions](https://www.optimal-media.com/wp-content/uploads/BD-Umschlag_10_std_en.pdf)

## 3. Edit your collection in VS Code

1. In the VS Code Explorer, open **collection.json**. Copy the film object inside the example’s square brackets into your existing `films` list. Use a comma between entries and give the new title a unique ID.
2. Change the title, year, runtime, genres and synopsis to match your film. Set `formats` to the discs you have, for example `["4K UHD", "Blu-ray"]`. Set `status` to `"owned"` or `"wishlist"`. Set `atmos` to `true` or `false`.
3. Set `poster` to the WebP path printed by the converter. You can leave `backdrop` and `logo` as empty strings or point them to artwork in `assets/`. Set `shelfOrder` to place the title on your shelf. If you want a featured banner, set `featuredId` to the ID of your chosen title.
4. Press **⌘S** and refresh the local preview. If it reports a loading error, check VS Code’s **Problems** panel for a missing comma or quote. You can also check JSON syntax in the terminal with `python3 -m json.tool collection.json > /dev/null`.

```json
{
  "featuredId": "interstellar-2014",
  "films": [
    {
      "id": "interstellar-2014",
      "title": "Interstellar",
      "year": 2014,
      "runtime": 169,
      "genres": ["Sci-Fi", "Adventure"],
      "overview": "A crew travels through a wormhole in search of a new home for humanity.",
      "status": "owned",
      "formats": ["4K UHD", "Blu-ray"],
      "atmos": false,
      "edition": "",
      "shelfOrder": 155,
      "poster": "assets/covers/interstellar-2014.webp",
      "backdrop": "",
      "logo": ""
    }
  ]
}
```

## 4. Publish the repository from VS Code

1. Sign in to [GitHub](https://github.com/) and verify your email address if prompted. The project folder already has a Git repository on the `main` branch.
2. Open **Source Control** in VS Code using the icon on the left. Review the files under **Changes**, then stage them with the **+** next to **Changes**. Enter `Build Blu-ray library` in the message box and click **Commit**.
3. If Git asks for an author name or email, run these commands in the VS Code terminal with your details, then retry the commit. Use your verified GitHub email or the GitHub-provided no-reply email shown in your account settings.

   ```sh
   git config user.name "YOUR NAME"
   git config user.email "YOUR GITHUB EMAIL"
   ```

4. Press **⇧⌘P**, run **Publish to GitHub**, and sign in when prompted. Enter `evo-bluray` as the repository name and choose **Publish to GitHub public repository**. A public repository supports GitHub Pages on GitHub Free. Its files and commit history are public.
5. Visit `https://github.com/YOUR-USERNAME/evo-bluray` and confirm that you can see `index.html`, `collection.json`, and the `assets` folder on `main`.

[VS Code source control quickstart](https://code.visualstudio.com/docs/sourcecontrol/quickstart) · [GitHub Pages availability](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)

## 5. Enable GitHub Pages and connect the domain

1. In GitHub, click your profile picture → **Settings → Pages → Add a domain**. Enter `coasterevo.com`. GitHub will show a **TXT** record name and value.
2. Sign in to the service that manages DNS for `coasterevo.com`. Open its DNS records screen and add the TXT record GitHub provided. If the form automatically adds `.coasterevo.com`, enter only the prefix GitHub gave you. Return to GitHub, click **Verify**, and keep the TXT record in DNS.
3. Open the **evo-bluray repository** on GitHub. Go to **Settings → Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**. Choose **main** and **/ (root)**, then click **Save**.
4. In that same repository Pages screen, enter `bluray.coasterevo.com` under **Custom domain** and save it if it is not already displayed. The project includes the matching `CNAME` file.
5. Back in your DNS provider, add this record. Replace `YOUR-USERNAME` with your actual GitHub username.

   | DNS field | What to enter |
   | --- | --- |
   | Type | CNAME |
   | Name / Host | `bluray` |
   | Target / Value | `YOUR-USERNAME.github.io` |
   | TTL | Auto or default |

   If the form asks for the full record name, use `bluray.coasterevo.com`. The target is your account’s `.github.io` address without the repository path. If the exact `bluray` host already has a record, check what it serves before replacing it.

6. In the GitHub repository’s **Actions** tab, wait for Pages to deploy successfully. Return to **Settings → Pages** and turn on **Enforce HTTPS** once it becomes available. DNS changes can take up to 24 hours to become visible.
7. Open [bluray.coasterevo.com](https://bluray.coasterevo.com) in a private browser window and confirm that your films and artwork appear.

[Domain verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages) · [Pages publishing branch](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [Custom subdomain setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

## 6. Publish later edits

1. In VS Code, add the new WebP cover, edit `collection.json`, and check the localhost preview.
2. Under **Source Control**, stage both the collection file and the new artwork. Enter a message such as `Add Interstellar to collection`, click **Commit**, then click **Sync Changes** or run **Git: Push** from the command palette.
3. Check **Actions** on GitHub for the successful Pages deployment, then refresh the public site.

If a cover is missing online, check that its path in `collection.json` exactly matches the filename, including capitalisation, and that both files appear in GitHub. If the entire site returns 404, confirm the publishing branch and check the latest Pages deployment. If the converter cannot download an Apple link, open the image in your browser, save it, and run the local-file command from step 2.

[Push and sync in VS Code](https://code.visualstudio.com/docs/sourcecontrol/repos-remotes)

# GameTrade MY Product Notes

## Current Decisions

- Seller listing proof photos are required for account-like products. The first version supports up to 6 JPG, PNG, or WebP images, with a maximum of 8 MB per image.
- Listing photos are stored through S3-compatible object storage such as Cloudflare R2. Until real storage credentials are configured, the upload API returns a clear storage configuration error.
- Normal customers must not see the admin navigation item. The admin page and admin APIs remain role protected, so direct `/admin` visits by non-admin users are rejected.
- Honor of Kings is modeled as one lobby game. Inside the game market, users choose China version or International version first, then platform and login channel when needed.

## Honor of Kings Variants

- China version: iOS WeChat, iOS QQ, Android WeChat, Android QQ.
- International version: iOS Global, Android Global.
- Legacy lobby links such as `honor-kings-ios-wechat` redirect to the parent `honor-of-kings` page with the correct preselected variant.

## Future User Photo Intake

When the user provides game-specific photos later:

- Save them under `assets/game-posters/` if they are market/game cover photos.
- Use seller-upload storage for listing proof photos, not the public asset folder.
- Prefer 16:9 market posters for game cards and clear in-game screenshots for listing proof.
- Do not expose sensitive account details in public listing images.

## Next Product Ideas To Consider

- Add seller-side image management after listing creation: reorder, replace, hide, or submit extra evidence.
- Add buyer-side image zoom and report buttons on listing detail pages.
- Add admin image moderation statuses per image, not only per listing.
- Add watermarking for uploaded seller proof images before showing them publicly.
- Add a separate evidence vault inside the order room for private delivery proof.

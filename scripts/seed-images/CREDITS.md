# Image credits

All photographs are from [Unsplash](https://unsplash.com) and used under the
[Unsplash License](https://unsplash.com/license): free for commercial use, no
permission or attribution required (attribution is appreciated). They are demo
photography for the seeded catalog — replace them with your own product photos
through **Admin → Products / Categories** as real inventory arrives.

Each entry is the photo's ID on Unsplash's image CDN
(`https://images.unsplash.com/<id>`); search for the ID on unsplash.com to find
the photographer.

## Homepage (`public/images/home/`)

| File | Unsplash photo |
| --- | --- |
| `hero-living.jpg` | `photo-1631510390389-c1e4fb20ff31` |
| `deals-kitchen.jpg` | `photo-1628797279405-8cd6ffdbeb6c` |
| `lifestyle-loft.jpg` | `photo-1617228133035-2347f159e755` |

## Catalog (`products/` and `categories/` here)

`manifest.json` maps every product slug and category slug to its Unsplash photo
ID. The files are those photos, cropped (square for products, 4:5 for
categories) and compressed. Upload them with:

```
node --env-file=.env --import tsx scripts/seed-images.ts
```

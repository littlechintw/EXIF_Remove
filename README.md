# EXIF Remover

A privacy-focused web application for removing metadata from photos and videos. All processing happens in your browser - your files never leave your device.

![EXIF Remover Screenshot](https://github.com/user-attachments/assets/127dcdee-d8d7-4b1d-a4f2-d6ba287aa81a)

## Features

✨ **100% Client-Side Processing** - No server uploads, complete privacy

📸 **Image Support** - JPEG, PNG, and HEIC files

🎬 **Video Support** - MP4 files (basic metadata display)

🔍 **Metadata Viewer** - View all EXIF data before removal

⚙️ **Quality Control** - Adjustable JPEG compression (60-100%)

📊 **Before/After Stats** - See file size reduction

💾 **Easy Download** - One-click download of processed files

🎨 **Modern UI** - Clean, responsive design with dark mode support

📱 **Drag & Drop** - Easy file upload interface

## Tech Stack

- **Vite** - Fast build tool
- **Vue 3** - Progressive JavaScript framework with Composition API
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Modern utility-first CSS
- **exif-js** - EXIF data extraction
- **piexifjs** - EXIF manipulation

## Getting Started

### Prerequisites

- Node.js 20+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/littlechintw/EXIF_Remove.git
cd EXIF_Remove

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Upload a File**: Click "Click to upload" or drag & drop an image/video file
2. **View Metadata**: See all EXIF data extracted from the file
3. **Adjust Quality** (images only): Use the slider to set JPEG quality (default 92%)
4. **Remove Metadata**: Click "Remove All Metadata" to strip all EXIF data
5. **Download**: Click "Download Processed File" to save the cleaned file

## How It Works

### Image Processing

The application uses two methods for removing EXIF data from images:

1. **Canvas Method** (default): Draws the image to an HTML5 canvas and re-exports it as JPEG, which naturally strips all EXIF data while allowing quality control.

2. **Selective Removal** (advanced): Uses piexifjs to remove only selected EXIF tags while preserving others.

### Video Processing

For videos, the application extracts basic metadata (duration, resolution, file info) using the HTML5 video element. Full video metadata removal would require ffmpeg.wasm (not included in MVP to keep bundle size small).

## Privacy & Security

- ✅ All processing happens in your browser
- ✅ No files are uploaded to any server
- ✅ No data is collected or stored
- ✅ Works completely offline (after initial page load)
- ✅ Open source - audit the code yourself

## Project Structure

```
src/
├── components/
│   ├── FileUploader.vue      # Drag & drop file upload
│   ├── MetadataViewer.vue    # Display and select metadata
│   ├── QualityControl.vue    # JPEG quality slider
│   └── DownloadButton.vue    # Download processed files
├── composables/
│   ├── useImageProcessor.ts  # Image processing logic
│   └── useVideoProcessor.ts  # Video metadata handling
├── utils/
│   ├── exif.ts              # EXIF extraction/removal
│   └── videoMetadata.ts     # Video metadata extraction
├── types/
│   └── piexifjs.d.ts        # TypeScript declarations
├── App.vue                  # Main application
└── main.ts                  # Application entry point
```

## Browser Support

Modern browsers with support for:
- HTML5 Canvas
- File API
- Blob API
- ES6+ JavaScript

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Limitations

- **HEIC Support**: Browser-dependent, may require conversion
- **Video Metadata Removal**: Basic version only displays metadata; full removal requires ffmpeg.wasm
- **Large Files**: Performance depends on device capabilities
- **Selective EXIF Removal**: Simplified implementation in current version

## Future Enhancements

- 🎥 Full video metadata removal with ffmpeg.wasm
- 📷 HEIC to JPEG conversion
- 🔄 Batch processing
- 💾 PWA support for offline use
- 📦 Chrome Extension version
- 🌐 Multi-language support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [exif-js](https://github.com/exif-js/exif-js) - EXIF reading library
- [piexifjs](https://github.com/hMatoba/piexifjs) - EXIF manipulation
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [Vue 3](https://vuejs.org/) - The Progressive JavaScript Framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

Made with ❤️ for privacy-conscious users

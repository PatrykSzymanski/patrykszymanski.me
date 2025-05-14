import lightGallery from 'lightgallery';
import lgZoom from 'lightgallery/plugins/zoom';
import lgFullscreen from 'lightgallery/plugins/fullscreen';

import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-fullscreen.css';
document.addEventListener('DOMContentLoaded', function () {
    const galleries = document.querySelectorAll('.lightgallery');
    galleries.forEach(gallery => {
        lightGallery(gallery, {
            selector: 'this',
            plugins: [lgZoom, lgFullscreen],
            download: false,
            counter: false,
            showZoomInOutIcons: true,
            actualSize: false,
            mode: 'lg-fade',
            speed: 500,
            escKey: true,
            hideBarsDelay: 3000,
            hideScrollbar: true,
            getCaptionFromTitleOrAlt: true,
            mobileSettings: {
                controls: true,
                showCloseIcon: true,
                download: false,
            },
        });
    });
});

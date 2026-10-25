import * as React from 'react';
import {createRoot} from 'react-dom/client';
import ProjectGallery from './components/ui/project-gallery';
// The atmosphere is CSS: the PSP is the page's only WebGL surface.
const gallery = document.getElementById('gallery-root');
if (gallery) createRoot(gallery).render(<ProjectGallery/>);

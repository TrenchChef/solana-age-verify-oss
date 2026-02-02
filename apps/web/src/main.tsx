import { Buffer } from 'buffer'
window.Buffer = Buffer
window.global = window
window.process = window.process || { env: {} }

import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <App />,
)

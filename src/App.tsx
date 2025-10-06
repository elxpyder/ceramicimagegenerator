import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Gallery from './components/Gallery';
import ImageGenerator from './components/ImageGenerator';
import ReferenceManager from './components/ReferenceManager';
import Settings from './components/Settings';
import ToastContainer from './components/ToastContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ImageContextProvider } from './context/ImageContext';
import { FirebaseProvider } from './context/FirebaseContext';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <NotificationProvider>
          <ImageContextProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/generate" element={<ImageGenerator />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/references" element={<ReferenceManager />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </main>
                <ToastContainer />
              </div>
            </Router>
          </ImageContextProvider>
        </NotificationProvider>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}

export default App;
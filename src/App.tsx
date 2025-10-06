import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Gallery from './components/Gallery';
import ImageGenerator from './components/ImageGenerator';
import ReferenceManager from './components/ReferenceManager';
import Settings from './components/Settings';
import ToastContainer from './components/ToastContainer.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { ImageContextProvider } from './context/ImageContext';
import { FirebaseProvider } from './context/FirebaseContext';
import { NotificationProvider } from './context/NotificationContext';
import { FirebaseConfigProvider } from './context/FirebaseConfigContext';

function App() {
  return (
    <ErrorBoundary>
      <FirebaseConfigProvider>
        <FirebaseProvider>
          <NotificationProvider>
            <ImageContextProvider>
              <Suspense fallback={<div>Loading...</div>}>
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
              </Suspense>
            </ImageContextProvider>
          </NotificationProvider>
        </FirebaseProvider>
      </FirebaseConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
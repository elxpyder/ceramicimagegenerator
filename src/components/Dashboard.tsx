
import { useImageContext } from '../context/ImageContext';
import { Palette, Image, FolderOpen, TrendingUp, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { referenceImages } = useImageContext();

  const totalImages = referenceImages.length;
  const generatedCount = referenceImages.filter(img => img.name.startsWith('Generated:')).length;
  const uploadedCount = referenceImages.filter(img => !img.name.startsWith('Generated:')).length;
  const activeCount = referenceImages.filter(img => img.isActive).length;
  
  const activeReferences = referenceImages.filter(img => img.isActive);
  const recentImages = referenceImages
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    .slice(0, 4);

  const stats = [
    {
      name: 'Total Images',
      value: totalImages,
      icon: Image,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/references'
    },
    {
      name: 'Generated Images', 
      value: generatedCount,
      icon: Palette,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      href: '/references'
    },
    {
      name: 'Active References',
      value: activeCount,
      icon: FolderOpen,
      color: 'text-green-600',
      bg: 'bg-green-50',
      href: '/references'
    },
    {
      name: 'Uploaded References',
      value: uploadedCount,
      icon: Upload,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      href: '/references'
    },
    {
      name: 'Total References',
      value: referenceImages.length,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      href: '/references'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Ceramic Model Generator
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Create AI-generated reference images for your ceramic modeling projects
        </p>
        <Link
          to="/generate"
          className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          <Palette className="w-5 h-5" />
          <span>Start Generating</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              to={stat.href}
              className="block group"
            >
              <div className="card hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Images */}
      {recentImages.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Generations
            </h2>
            <Link
              to="/gallery"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentImages.map((image) => (
              <div key={image.id} className="image-card">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-sm font-medium truncate">
                      {image.name}
                    </p>
                    <p className="text-white/80 text-xs">
                      {image.uploadedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active References */}
      {activeReferences.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Active References
            </h2>
            <Link
              to="/references"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Manage
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {activeReferences.map((image) => (
              <div key={image.id} className="aspect-square">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover rounded-lg shadow-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {totalImages === 0 && (
        <div className="card text-center">
          <div className="py-8">
            <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Get Started with Image Generation
            </h3>
            <p className="text-gray-600 mb-6">
              Upload reference images and start generating custom ceramic model designs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/references"
                className="btn-secondary"
              >
                Upload References
              </Link>
              <Link
                to="/generate"
                className="btn-primary"
              >
                Generate Images
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Animated 404 Number */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h1 className="text-[12rem] md:text-[16rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 via-pink-600 to-orange-600 dark:from-blue-400 dark:via-purple-400 dark:via-pink-400 dark:to-orange-400 animate-pulse leading-none">
              404
            </h1>
            <div className="absolute -top-8 -right-8 animate-bounce delay-300">
              <Sparkles className="h-16 w-16 text-yellow-400 dark:text-yellow-300 opacity-80" />
            </div>
            <div className="absolute -bottom-4 -left-8 animate-bounce delay-700">
              <Zap className="h-12 w-12 text-purple-400 dark:text-purple-300 opacity-70" />
            </div>
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl">
          <CardHeader className="text-center pb-6 pt-8">
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100 dark:from-red-900/40 dark:via-orange-900/40 dark:to-yellow-900/40 shadow-lg animate-pulse">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 dark:from-red-400 dark:to-orange-400 flex items-center justify-center">
                <span className="text-3xl">⚠</span>
              </div>
            </div>
            <CardTitle className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent">
              Oops! Page Not Found
            </CardTitle>
            <CardDescription className="text-lg md:text-xl text-slate-600 dark:text-slate-300">
              The page you're looking for seems to have vanished into the digital void.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Button
                onClick={() => navigate('/')}
                className="flex-1 group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <Home className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  Go to Home
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="flex-1 group border-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300"
                size="lg"
              >
                <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
                Go Back
              </Button>
            </div>

            {/* Fun Message */}
            <div className="text-center pt-4">
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 italic font-medium">
                "Not all who wander are lost, but you might be." 🗺️
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Floating Particles Effect */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75"></div>
        <div className="absolute top-40 right-20 w-2 h-2 bg-purple-400 rounded-full animate-ping opacity-75 delay-300"></div>
        <div className="absolute bottom-32 left-20 w-2 h-2 bg-pink-400 rounded-full animate-ping opacity-75 delay-700"></div>
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-orange-400 rounded-full animate-ping opacity-75 delay-1000"></div>
      </div>
    </div>
  );
};

export default NotFound;

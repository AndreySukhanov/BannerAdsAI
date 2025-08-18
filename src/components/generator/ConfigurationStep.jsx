// React import not needed with new JSX transform
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Monitor, Palette, ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function ConfigurationStep({ config, setConfig, onNext }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (config.url && config.size && config.template) {
      onNext();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.21, 1, 0.81, 1] }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center justify-center w-16 h-16 brand-gradient rounded-2xl mb-6 shadow-lg"
        >
          <Zap className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
          Создайте идеальный баннер
        </h1>
        <p className="text-lg text-gray-600 text-balance max-w-md mx-auto">
          Введите параметры, и ИИ создаст профессиональные рекламные баннеры за минуты
        </p>
      </div>

      <Card className="surface-elevated interactive-scale border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* URL Input */}
            <div className="space-y-3">
              <Label htmlFor="url" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                URL посадочной страницы
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://your-website.com"
                value={config.url}
                onChange={(e) => setConfig({...config, url: e.target.value})}
                className="h-12 text-base border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl smooth-transition"
                required
              />
              <p className="text-sm text-gray-500">
                Введите URL страницы, куда будет вести баннер
              </p>
            </div>

            {/* Size Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-600" />
                Размер баннера
              </Label>
              <Select 
                value={config.size} 
                onValueChange={(value) => setConfig({...config, size: value})}
              >
                <SelectTrigger className="h-12 text-base border-gray-200 focus:border-indigo-500 rounded-xl">
                  <SelectValue placeholder="Выберите размер" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="300x250" className="p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-9 bg-gradient-to-r from-blue-100 to-indigo-100 border border-indigo-200 rounded-lg shadow-sm"></div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">300 × 250 px</div>
                        <div className="text-sm text-gray-500">Средний прямоугольник</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="336x280" className="p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-10 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-lg shadow-sm"></div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">336 × 280 px</div>
                        <div className="text-sm text-gray-500">Большой прямоугольник</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-600" />
                Цветовая схема
              </Label>
              <Select 
                value={config.template} 
                onValueChange={(value) => setConfig({...config, template: value})}
              >
                <SelectTrigger className="h-12 text-base border-gray-200 focus:border-indigo-500 rounded-xl">
                  <SelectValue placeholder="Выберите цветовую схему" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="blue_white" className="p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-blue-600 rounded-lg shadow-sm flex items-center justify-center">
                        <div className="w-8 h-5 bg-white rounded text-xs font-medium"></div>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">Синий + белый</div>
                        <div className="text-sm text-gray-500">Классический деловой стиль</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="red_white" className="p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-red-600 rounded-lg shadow-sm flex items-center justify-center">
                        <div className="w-8 h-5 bg-white rounded text-xs"></div>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">Красный + белый</div>
                        <div className="text-sm text-gray-500">Яркий привлекающий стиль</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-base font-semibold brand-gradient hover:shadow-xl smooth-transition rounded-xl"
              disabled={!config.url || !config.size || !config.template}
            >
              Создать заголовки
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
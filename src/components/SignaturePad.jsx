import React, { useRef, useState, useEffect } from 'react'
import SignaturePad from 'signature_pad'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Trash2, Save, Edit3, Upload, Smartphone, Monitor } from 'lucide-react'

const SignaturePadComponent = ({ 
  title, 
  onSave, 
  initialSignature = null,
  disabled = false 
}) => {
  const canvasRef = useRef(null)
  const signaturePadRef = useRef(null)
  const fileInputRef = useRef(null)
  const [hasSignature, setHasSignature] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('draw')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    // Detectar se é dispositivo touch
    const checkTouchDevice = () => {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0
    }
    setIsTouchDevice(checkTouchDevice())
    
    // Sempre começar com a aba de desenho para permitir mouse
    setActiveTab('draw')
  }, [])

  useEffect(() => {
    if (canvasRef.current && activeTab === 'draw') {
      // Limpar instância anterior se existir
      if (signaturePadRef.current) {
        signaturePadRef.current.off()
        signaturePadRef.current = null
      }

      // Aguardar um frame para garantir que o canvas esteja renderizado
      requestAnimationFrame(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Configurar canvas para alta resolução
        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        
        // Obter dimensões reais do canvas
        const rect = canvas.getBoundingClientRect()
        const width = rect.width
        const height = rect.height
        
        // Configurar tamanho do canvas
        canvas.width = width * ratio
        canvas.height = height * ratio
        canvas.style.width = width + 'px'
        canvas.style.height = height + 'px'
        
        const ctx = canvas.getContext('2d')
        ctx.scale(ratio, ratio)
        
        // Inicializar SignaturePad com configurações otimizadas para mouse
        signaturePadRef.current = new SignaturePad(canvas, {
          backgroundColor: 'rgb(255, 255, 255)',
          penColor: 'rgb(0, 0, 0)',
          minWidth: 0.5,
          maxWidth: 2.5,
          throttle: 0, // Remover throttle para melhor responsividade do mouse
          minDistance: 0, // Permitir pontos mais próximos para mouse
          velocityFilterWeight: 0.7,
          dotSize: function() {
            return (this.minWidth + this.maxWidth) / 2
          }
        })

        // Event listeners
        signaturePadRef.current.addEventListener('beginStroke', () => {
          setHasSignature(true)
          setUploadedImage(null)
        })

        signaturePadRef.current.addEventListener('endStroke', () => {
          setHasSignature(!signaturePadRef.current.isEmpty())
        })

        // Carregar assinatura inicial se existir
        if (initialSignature && !isEditing) {
          signaturePadRef.current.fromDataURL(initialSignature)
          setHasSignature(true)
        }
      })
    }

    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.off()
      }
    }
  }, [activeTab, isEditing, initialSignature])

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear()
    }
    setHasSignature(false)
    setUploadedImage(null)
  }

  const saveSignature = () => {
    let dataURL = null
    
    if (activeTab === 'draw' && signaturePadRef.current && hasSignature) {
      dataURL = signaturePadRef.current.toDataURL('image/png')
    } else if (activeTab === 'upload' && uploadedImage) {
      dataURL = uploadedImage
    }
    
    if (dataURL) {
      onSave(dataURL)
      setIsEditing(false)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target.result)
        setHasSignature(false) // Clear canvas signature
        if (signaturePadRef.current) {
          signaturePadRef.current.clear()
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const startEditing = () => {
    setIsEditing(true)
    clearSignature()
  }

  const canSave = (activeTab === 'draw' && hasSignature) || (activeTab === 'upload' && uploadedImage);
  // Se há assinatura salva e não está editando, mostrar preview
  if (initialSignature && !isEditing) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span className="flex items-center">
              <Edit3 className="h-4 w-4 mr-2" />
              {title}
            </span>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              Assinado
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="border rounded-lg p-2 bg-gray-50">
            <img 
              src={initialSignature} 
              alt="Assinatura" 
              className="w-full h-20 object-contain"
            />
          </div>
          {!disabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={startEditing}
              className="w-full"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Editar Assinatura
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <Edit3 className="h-4 w-4 mr-2" />
          {title}
          <span className="text-xs text-gray-500 ml-2">(Opcional)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draw" className="flex items-center gap-2">
              {isTouchDevice ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
              {isTouchDevice ? 'Desenhar' : 'Mouse'}
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="draw" className="space-y-3">
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white p-1">
              <canvas
                ref={canvasRef}
                className="w-full h-32 touch-none block"
                style={{ 
                  width: '100%', 
                  height: '128px',
                  cursor: 'crosshair',
                  display: 'block'
                }}
                onMouseDown={(e) => {
                  // Garantir que o canvas está focado para eventos de mouse
                  e.currentTarget.focus()
                }}
              />
            </div>
            <div className="text-xs text-gray-500 text-center">
              {isTouchDevice 
                ? 'Use a caneta do tablet ou dedo para assinar acima'
                : 'Clique e arraste o mouse para desenhar a assinatura acima'
              }
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="signature-upload">Enviar imagem da assinatura</Label>
              <Input
                id="signature-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="cursor-pointer"
              />
            </div>
            
            {uploadedImage && (
              <div className="border rounded-lg p-2 bg-gray-50">
                <img 
                  src={uploadedImage} 
                  alt="Assinatura enviada" 
                  className="w-full h-20 object-contain"
                />
              </div>
            )}
            
            <div className="text-xs text-gray-500 text-center">
              Formatos aceitos: JPG, PNG, GIF
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={!canSave || disabled}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
          <Button
            size="sm"
            onClick={saveSignature}
            disabled={!canSave || disabled}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default SignaturePadComponent


import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export const printBoletim = async (boletimElement, boletimNumber) => {
  try {
    // Configurar estilos para impressão
    const originalStyle = document.body.style.cssText
    document.body.style.cssText = 'margin: 0; padding: 0;'
    
    // Criar canvas da página
    const canvas = await html2canvas(boletimElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: boletimElement.scrollWidth,
      height: boletimElement.scrollHeight
    })

    // Restaurar estilos originais
    document.body.style.cssText = originalStyle

    // Criar PDF
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 295 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    let position = 0

    // Adicionar primeira página
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Adicionar páginas adicionais se necessário
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Salvar PDF
    pdf.save(`boletim-${boletimNumber}.pdf`)
    
    return true
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    throw new Error('Erro ao gerar PDF do boletim')
  }
}

export const printPage = () => {
  window.print()
}


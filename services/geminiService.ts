
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Sale, Expense, ChatMessage, QatCategory } from "../types";
import { audioService } from "./audioService";
import { logger } from "./loggerService";

/**
 * دالة مصنع لإنشاء استنتاج من GoogleGenAI
 */
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const SYSTEM_INSTRUCTION = `
أنت "المحاسب الخارق" لوكالة الشويع للقات. لديك صلاحيات مطلقة لإدارة النظام.

قواعد الاستجابة والذكاء الصارمة:
1. الشخصية: خبير محاسبي يمني. تحدث بلهجة السوق (ميراد، قيد، آجل).
2. منع التكرار: يمنع إضافة أسماء موجودة مسبقاً.
3. الصلاحيات: يمكنك (إضافة/تعديل/حذف) العملاء والموردين والعمليات المالية.
4. العملات: افترض YER دائماً إلا إذا ذُكر غير ذلك.
5. في حال طلب المدير "مرتجع"، ابحث عن آخر فاتورة لنفس الشخص وقم بإلغائها.
`;

export const aiTools: FunctionDeclaration[] = [
  {
    name: 'recordSale',
    description: 'تسجيل عملية بيع لعميل موجود.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customer_name: { type: Type.STRING, description: 'اسم العميل الكامل' },
        qat_type: { type: Type.STRING, description: 'نوع القات' },
        quantity: { type: Type.NUMBER, description: 'الكمية بالأكياس' },
        unit_price: { type: Type.NUMBER, description: 'سعر الكيس الواحد' },
        currency: { type: Type.STRING, enum: ['YER', 'SAR', 'OMR'] },
        status: { type: Type.STRING, enum: ['نقدي', 'آجل'] }
      },
      required: ['customer_name', 'qat_type', 'quantity', 'unit_price', 'currency', 'status']
    }
  },
  {
    name: 'recordReturn',
    description: 'إلغاء فاتورة سابقة (مرتجع).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        operation_type: { type: Type.STRING, enum: ['بيع', 'شراء'] },
        person_name: { type: Type.STRING },
        qat_type: { type: Type.STRING }
      },
      required: ['operation_type', 'person_name']
    }
  },
  {
    name: 'managePerson',
    description: 'إضافة أو حذف عميل أو مورد.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['إضافة', 'تعديل', 'حذف'] },
        type: { type: Type.STRING, enum: ['عميل', 'مورد'] },
        name: { type: Type.STRING },
        phone: { type: Type.STRING },
        address_region: { type: Type.STRING }
      },
      required: ['action', 'type', 'name']
    }
  },
  {
    name: 'recordVoucher',
    description: 'تسجيل سند قبض أو دفع مالي.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ['قبض', 'دفع'] },
        person_name: { type: Type.STRING },
        amount: { type: Type.NUMBER },
        currency: { type: Type.STRING, enum: ['YER', 'SAR', 'OMR'] },
        notes: { type: Type.STRING }
      },
      required: ['type', 'person_name', 'amount', 'currency']
    }
  },
  {
    name: 'systemControl',
    description: 'تنفيذ أوامر النظام مثل النسخ الاحتياطي.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: { type: Type.STRING, enum: ['نسخ_احتياطي', 'تحديث_الصرف'] },
        sar_rate: { type: Type.NUMBER },
        omr_rate: { type: Type.NUMBER }
      },
      required: ['command']
    }
  }
];

export const getChatResponse = async (message: string, history: ChatMessage[], context: any) => {
  const ai = getAIClient();
  const ctxString = `السياق: العملاء (${context.customers?.length}), الموردون (${context.suppliers?.length}), الصرف (SAR:${context.rates?.SAR_TO_YER})`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: message,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION + "\n" + ctxString,
        tools: [{ functionDeclarations: aiTools }],
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    return { text: response.text, toolCalls: response.functionCalls };
  } catch(e) {
    logger.error("AI Error:", e);
    return { text: "المعذرة يا مدير، تعذر الاتصال بالسيرفر حالياً.", toolCalls: [] };
  }
};

export const speakText = async (text: string, onEnded: () => void) => {
  return await audioService.speak(text, onEnded);
};

export const stopSpeaking = () => {
  audioService.stop();
};

export const getQuickInsight = async (sales: Sale[]) => {
  const ai = getAIClient();
  const prompt = `حلل المبيعات باختصار شديد بلهجة صنعانية:\n${JSON.stringify(sales.slice(0, 10))}`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (e) {
    return "لا توجد رؤية حالياً.";
  }
};

export const getFinancialForecast = async (sales: Sale[], expenses: Expense[], categories: QatCategory[]) => {
  const ai = getAIClient();
  const prompt = `بصفتك محلل مالي خبير لوكالة قات، حلل البيانات التالية وقدم توقعات مالية ونصائح استراتيجية للنمو بلهجة يمنية احترافية:\n
  المبيعات (آخر 20 عملية): ${JSON.stringify(sales.slice(0, 20))}\n
  المصاريف (آخر 20 عملية): ${JSON.stringify(expenses.slice(0, 20))}\n
  حالة المخزون الحالي: ${JSON.stringify(categories)}`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 8000 }
      }
    });
    return response.text;
  } catch (e) {
    logger.error("Forecast AI Error:", e);
    return "تعذر تحليل التوقعات المالية حالياً، يرجى المحاولة لاحقاً.";
  }
};

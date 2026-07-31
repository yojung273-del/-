import React, { useState, useEffect } from 'react';
import { X, Check, Copy, Database, ExternalLink, HelpCircle, RefreshCw } from 'lucide-react';
import { getStoredGasUrl, setStoredGasUrl, GAS_SCRIPT_TEMPLATE } from '../services/gasService';

interface GASConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (url: string) => void;
}

export const GASConfigModal: React.FC<GASConfigModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [gasUrl, setGasUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGasUrl(getStoredGasUrl());
      setTestStatus('idle');
      setTestMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GAS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setStoredGasUrl(gasUrl);
    onSaved(gasUrl);
    onClose();
  };

  const handleTestConnection = async () => {
    if (!gasUrl.trim()) {
      setTestStatus('error');
      setTestMessage('GAS Web App URL을 입력해 주세요.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('구글 시트 연동을 테스트하는 중...');

    try {
      const res = await fetch(`${gasUrl.trim()}?action=getHistory`);
      const data = await res.json();
      if (data && data.success) {
        setTestStatus('success');
        setTestMessage('✅ 구글 시트 연동 성공! 정상적으로 연결되었습니다.');
      } else {
        setTestStatus('error');
        setTestMessage(`❌ 연동 실패: ${data.error || '응답이 비정상적입니다.'}`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`❌ 연동 오류: ${err.message || 'CORS 또는 URL 주소를 확인하세요.'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#E8E2D9]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5F2EC] bg-[#FAFAF7]">
          <div className="flex items-center gap-2 text-[#2D2D2D]">
            <Database className="w-5 h-5 text-[#34A853]" />
            <h2 className="text-lg font-bold">구글 시트(GAS) 백엔드 연동 설정</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A08E7B] hover:text-[#2D2D2D] hover:bg-[#F5F2EC] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-[#4A4A4A]">
          {/* Section 1: GAS Web App URL Input */}
          <div className="space-y-2">
            <label className="block font-semibold text-[#2D2D2D]">
              1. 배포된 Google Apps Script Web App URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={gasUrl}
                onChange={(e) => setGasUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 border border-[#E8E2D9] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#34A853]/30 focus:border-[#34A853]"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="px-4 py-2 bg-[#F5F2EC] hover:bg-[#E8E2D9] text-[#2D2D2D] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {testStatus === 'testing' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  '연동 테스트'
                )}
              </button>
            </div>
            {testMessage && (
              <p
                className={`text-xs mt-1 ${
                  testStatus === 'success' ? 'text-[#34A853] font-medium' : 'text-[#FF6B6B]'
                }`}
              >
                {testMessage}
              </p>
            )}
          </div>

          {/* Section 2: Instructions */}
          <div className="bg-[#FAF9F5] p-4 rounded-xl border border-[#F0EBE1] space-y-3">
            <h3 className="font-bold text-[#2D2D2D] flex items-center gap-1.5 text-xs sm:text-sm">
              <HelpCircle className="w-4 h-4 text-[#34A853]" />
              구글 시트 백엔드 구축 3분 가이드
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#6B5E52] leading-relaxed">
              <li>
                새 <strong className="text-[#2D2D2D]">구글 스프레드시트</strong>를 만듭니다.
              </li>
              <li>
                상단 메뉴의 <strong className="text-[#2D2D2D]">확장 프로그램 &gt; Apps Script</strong>를 클릭합니다.
              </li>
              <li>
                아래 복사 버튼을 눌러 스크립트 코드를 복사한 뒤, <strong className="text-[#2D2D2D]">Code.gs</strong> 편집기에 전체 덮어쓰기합니다.
              </li>
              <li>
                우측 상단 <strong className="text-[#2D2D2D]">배포 &gt; 새 배포</strong>를 클릭하고, 유형을 <strong className="text-[#2D2D2D]">웹 앱</strong>으로 설정합니다.
              </li>
              <li>
                <strong className="text-[#2D2D2D]">액세스 권한이 있는 사용자</strong>를 <strong className="text-[#FF6B6B]">모든 사용자 (Anyone)</strong>로 지정 후 배포합니다.
              </li>
              <li>생성된 Web App URL을 복사하여 위 입력창에 붙여넣습니다.</li>
            </ol>
          </div>

          {/* Section 3: Code block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#2D2D2D] text-xs sm:text-sm">
                2. 구글 앱스 스크립트 코드 (Code.gs)
              </label>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1 text-xs bg-[#34A853] hover:bg-[#2E9748] text-white rounded-lg flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '복사됨!' : '코드 복사'}
              </button>
            </div>
            <pre className="bg-[#1E1E1E] text-[#D4D4D4] p-3 rounded-xl text-xs overflow-x-auto max-h-48 font-mono leading-relaxed">
              {GAS_SCRIPT_TEMPLATE}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#F5F2EC] bg-[#FAFAF7] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#6B5E52] hover:bg-[#F5F2EC] rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold bg-[#34A853] hover:bg-[#2E9748] text-white rounded-xl shadow-sm transition-colors"
          >
            설정 저장
          </button>
        </div>
      </div>
    </div>
  );
};

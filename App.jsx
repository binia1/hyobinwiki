import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Book, Search, User, Clock, Star, PenTool, MessageSquare, History, X, Save, RotateCcw, Bold, Italic, ImageIcon, List, ChevronRight, ChevronDown } from 'lucide-react';

// --- Firebase Configuration & Initialization ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Image Map (Provided by User - Corrected for direct image link) ---
const IMAGE_MAP = {
  '효빈광역시': 'https://i.imgur.com/iYcyOlz.png',
  '남구': 'https://i.imgur.com/GKWRItK.png',
  '북구': 'https://i.imgur.com/kdSkuVp.png',
  '동구': 'https://i.imgur.com/WfloDcp.png',
  '서구': 'https://i.imgur.com/LzHidYM.png',
  '중구': 'https://i.imgur.com/GOBJzcQ.png',
  '안천구': 'https://i.imgur.com/7X32Jx0.png',
  '창전구': 'https://i.imgur.com/D9RghdZ.png',
  '청엽구': 'https://i.imgur.com/ocwoL8p.png',
  '탄성군': 'https://i.imgur.com/G7LbZmw.png'
};

// --- Helper Functions for HTML Generation (Global scope for seeding) ---

// Define Party Style Helpers
const partyColor = {
  '민주당': '#004EA2',
  '국민의힘': '#E61E2B',
  '진보당': '#D6001C',
  '조국혁신당': '#0073CF',
  '무소속': '#808080',
  '진보': '#009900' // NOTE: This is the default color, overridden inline below for Education Superintendent
};
const partyStyle = (color, text) => `<span style="background-color:${color}; color:white; padding:1px 4px; border-radius:3px; font-size:10px; font-weight:bold; white-space:nowrap; display:inline-block;">${text}</span>`;

// Data for Folding Sections
const cityCouncilData = [
    { party: '더불어민주당', color: partyColor['민주당'], seats: '34석', note: '지역구 30석, 비례대표 4석' },
    { party: '국민의힘', color: partyColor['국민의힘'], seats: '1석', note: '지역구 1석' },
    { party: '진보당', color: partyColor['진보당'], seats: '2석' },
    { party: '조국혁신당', color: partyColor['조국혁신당'], seats: '1석' },
];
const nationalAssemblyData = [
    { party: '더불어민주당', color: partyColor['민주당'], seats: '13석' },
    { party: '진보당', color: partyColor['진보당'], seats: '1석' },
];
const districtChiefData = [
    { party: '더불어민주당', color: partyColor['민주당'], seats: '8석' },
    { party: '조국혁신당', color: partyColor['조국혁신당'], seats: '1석' },
];


// 2. 정치 데이터 폴딩 함수 (2열로 분리)
const generateFoldingContent = (id, title, partyData) => {
    let rows = '';
    partyData.forEach(item => {
        rows += `
            <tr style="height: 25px;">
                <td style="width: 100px; padding: 2px 8px; border: 1px solid #ddd;">
                    ${partyStyle(item.color, item.party)}
                </td>
                <td style="padding: 2px 8px; border: 1px solid #ddd; text-align: left;">
                    ${item.seats} ${item.note ? `<span style="font-size: 0.8em; color: #666;">(${item.note})</span>` : ''}
                </td>
            </tr>
        `;
    });

    return `
        <tr class="border-b folding-header" data-target-id="${id}">
            <th class="bg-[#7777AA]" style="color:white; padding: 8px; cursor: pointer; text-align: left; width: 50%;">
                ${title} 
            </th>
            <th class="bg-[#7777AA]" style="color:white; padding: 8px; cursor: pointer; text-align: right; width: 50%;">
                <span class="folding-indicator" style="color:white; font-weight:normal; font-size: 11px;">
                    [펼치기/접기]
                </span>
            </th>
        </tr>
        <tr class="folding-content hidden" id="${id}">
            <td colspan="2" style="padding: 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    ${rows}
                </table>
            </td>
        </tr>
    `;
};

// --- Custom Modal Component (Replaces alert/prompt) ---
function CustomModal({ visible, type, message, onConfirm, onCancel, defaultValue, title }) {
    if (!visible) return null;

    const [inputValue, setInputValue] = useState(defaultValue || '');

    const handleConfirm = () => {
        if (type === 'prompt') {
            onConfirm(inputValue);
        } else {
            onConfirm();
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 mx-4">
                <h3 className="text-xl font-bold border-b pb-2 mb-4 text-[#7777AA]">{title || (type === 'prompt' ? '정보 입력' : '알림')}</h3>
                
                {/* JSX parsing fixed by adding closing tag to h3 */}

                <p className="mb-6 text-gray-700">{message}</p>
                
                {type === 'prompt' && (
                    <input 
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded mb-4 focus:ring-[#7777AA] focus:border-[#7777AA]"
                        placeholder="여기에 입력..."
                    />
                )}

                <div className="flex justify-end gap-2">
                    {type === 'confirm' && (
                        <button 
                            onClick={onCancel} 
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                        >
                            취소
                        </button>
                    )}
                    <button 
                        onClick={handleConfirm} 
                        className={`px-4 py-2 rounded font-bold transition-colors ${
                            type === 'prompt' || type === 'confirm' 
                                ? 'bg-[#7777AA] text-white hover:bg-[#555588]'
                                : 'bg-[#0645ad] text-white hover:bg-blue-800'
                        }`}
                    >
                        {type === 'prompt' ? '확인' : '닫기'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Wiki Content Display Component (Handles dangerouslySetInnerHTML and events) ---
function WikiContentDisplay({ htmlContent, onLinkClick }) {
    const contentRef = useRef(null);

    // Effect for handling clicks (internal links, smooth scroll, and folding)
    useEffect(() => {
        const contentDiv = contentRef.current;
        if (!contentDiv) return;

        const handleClicks = (e) => {
            
            // 1. Folding Toggle
            const header = e.target.closest('.folding-header');
            if (header) {
                e.preventDefault();
                const targetId = header.getAttribute('data-target-id');
                const targetElement = document.getElementById(targetId);
                // Note: Indicator text doesn't need to change, as per user's request for static text [펼치기/접기]
                // const indicator = header.querySelector('.folding-indicator');

                if (targetElement) {
                    targetElement.classList.toggle('hidden');
                    // if (indicator) {
                    //     indicator.innerHTML = targetElement.classList.contains('hidden') 
                    //         ? '<span class="closed-icon"><svg>...</svg></span>'
                    //         : '<span class="open-icon"><svg>...</svg></span>';
                    // }
                }
                return;
            }

            // 2. Internal Wiki Link Navigation
            const linkTarget = e.target.closest('a[data-wiki-title]');
            if (linkTarget) {
                e.preventDefault();
                const title = linkTarget.getAttribute('data-wiki-title');
                onLinkClick(title);
                return;
            }
            
            // 3. Hash Scroll
            const target = e.target.closest('a');
            if (target) {
                const href = target.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const id = href.substring(1);
                    const element = document.getElementById(id);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        // Highlight effect
                        element.style.backgroundColor = '#fff3cd';
                        setTimeout(() => { element.style.backgroundColor = 'transparent'; }, 2000);
                    }
                    return;
                }
            }

        };

        contentDiv.addEventListener('click', handleClicks);

        return () => {
            contentDiv.removeEventListener('click', handleClicks);
        };
    }, [htmlContent, onLinkClick]);

    return (
        <div ref={contentRef} className="prose max-w-none wiki-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
    );
}


// --- Main Application Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('main'); // main, doc, search
  const [currentDocTitle, setCurrentDocTitle] = useState('');
  const [docs, setDocs] = useState({}); // Local cache of all docs for search/list
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Auth Initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error:", error);
        setErrorMsg("로그인 중 문제가 발생했습니다.");
      } finally {
        // Set loading false here if initial auth fails before listener updates
        // The listener below will handle final state change, but this prevents infinite load if connection fails early.
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Data Synchronization (Real-time listener for all docs)
  useEffect(() => {
    if (!user) return;

    const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'wiki_docs');
    
    // Safety timeout
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Firestore timeout - forcing load completion");
        setLoading(false);
      }
    }, 8000);

    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      clearTimeout(safetyTimeout);
      
      const newDocs = {};
      snapshot.forEach(doc => {
        newDocs[doc.id] = doc.data();
      });
      
      // Update Check: Checking for the final, clean layout structure
      // Changed marker to V29_TRAFFIC_TABLE
      const needsUpdate = Object.keys(newDocs).length === 0 || 
                          (newDocs['효빈광역시'] && !newDocs['효빈광역시'].content.includes('<!-- FINAL_LAYOUT_V29_TRAFFIC_TABLE -->'));

      if (needsUpdate) {
        seedInitialData(collectionRef).catch(err => {
          console.error("Seeding failed:", err);
          setLoading(false);
        });
      } else {
        setDocs(newDocs);
        setLoading(false);
      }
    }, (error) => {
      console.error("Firestore Error:", error);
      setErrorMsg("데이터를 불러오는 중 오류가 발생했습니다.");
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [user]);

  // Seed Data Function (Updated with New Namuwiki Style Header Table)
  const seedInitialData = async (collectionRef) => {
    
    // Helper to generate a district card HTML (using actual image map)
    const generateDistrictHtml = (name, color = "7777AA") => {
      const imageUrl = IMAGE_MAP[name] || `https://placehold.co/60x60/${color}/ffffff?text=${name.substring(0,2)}`;
      const altText = `${name} 로고`;

      // MODIFIED: Retaining square logo display
      return `
        <div style="display: flex; flex-direction: column; align-items: center; margin: 10px; width: 80px;">
          <a href="#" data-wiki-title="${name}" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; align-items: center; transition: transform 0.2s;">
            <div style="width: 60px; height: 60px; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; background: white; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
              <img src="${imageUrl}" alt="${altText}" onerror="this.onerror=null; this.src='https://placehold.co/60x60/cccccc/000000?text=${name} 로고 에러'" style="width: 100%; height: 100%; object-fit: contain; padding: 5px;">
            </div>
            <span style="font-weight: bold; color: #0645ad; font-size: 0.95em;">${name}</span>
          </a>
        </div>
      `;
    };

    const districts = ['중구', '동구', '서구', '남구', '북구', '청엽구', '안천구', '창전구'];
    const counties = ['탄성군'];
    
    const districtsHtml = districts.map(d => generateDistrictHtml(d, '555588')).join('');
    const countiesHtml = counties.map(c => generateDistrictHtml(c, '448844')).join('');
    
    // 1. 복합 헤더 테이블 (통합 버전) - 인포박스 내부 제목 복원 및 컨테이너 스타일 조정
    const WIKI_HEADER_TABLE_INTEGRATED = `
    <!-- FINAL_LAYOUT_V8_FIXED -->
    <div class="wiki-infobox-container" style="float: right; margin-left: 10px; margin-bottom: 10px; width: 430px;">
      <table class="wiki-header-table" style="width: 100%; border-collapse: collapse;">
          <tbody style="border: 2px solid #7777AA;">
              <tr>
                  <td colspan="2" style="width: 100%; padding: 5px 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold; color: #373a3c; background-color: #f8f8f8;">
                      <span style="display: inline-flex; align-items: center; gap: 5px;">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Flag_of_South_Korea.svg/30px-Flag_of_South_Korea.svg.png" alt="대한민국 국기" style="height: 16px; width: auto;">
                          대한민국의 광역시
                      </span>
                  </td>
              </tr>
              <tr>
                  <td colspan="2" style="padding: 10px 15px; background-color: white; text-align: center; border-bottom: 1px solid #ddd;">
                      <!-- 휘장 및 이름: 내부 텍스트 복원 -->
                      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;">
                          <img src="https://i.imgur.com/iYcyOlz.png" alt="효빈광역시 휘장" style="width: 80px; height: 80px; display: block; border-radius: 5px;">
                          <div style="text-align: center;">
                              <div style="font-size: 1.5rem; font-weight: bold; color: #373a3c;">효빈광역시</div>
                              <div style="font-size: 1.0rem; font-weight: normal; color: #666;">孝彬廣域市<br>Hyobin Metropolitan City</div>
                          </div>
                      </div>
                  </td>
              </tr>
              <!-- 인포박스 상세 정보 시작 -->
              <tr class="border-b"><th class="bg-[#E8E8F3] text-[#7777AA] p-2 border-r w-1/3">시청 소재지</th><td class="p-2">북구 효빈로 79 (고송8동)</td></tr>
              <tr class="border-b"><th class="bg-[#E8E8F3] text-[#7777AA] p-2 border-r">하위 행정구역</th><td class="p-2">8구 1군</td></tr>
              <tr class="border-b"><th class="bg-[#E8E8F3] text-[#7777AA] p-2 border-r">면적</th><td class="p-2">729.0㎢</td></tr>
              <tr class="border-b"><th class="bg-[#E8E8F3] text-[#7777AA] p-2 border-r">인구</th><td class="p-2">2,967,406명<br><span class="text-xs text-gray-400">(2025년 기준)</span></td></tr>
              <tr class="border-b"><th class="bg-[#E8E8F3] text-[#7777AA] p-2 border-r">인구 밀도</th><td class="p-2">4,070.5 명/㎢</td></tr>
              <tr class="border-b"><th class="bg-[#E8E8F3] text-[#7777AA] p-2 border-r">GRDP</th><td class="p-2">$1,058억 (2022)</td></tr>
              <tr class="border-b"><th class="bg-[#E8E8F3] text-[#7777AA] p-2 border-r">1인당 GRDP</th><td class="p-2">$36,341 (2022)</td></tr>
              <tr class="border-b"><th class="bg-[#E8E8F3] text-[#7777AA] p-2 border-r">시장</th>
                <td class="p-2 text-left">
                  <div style="display:flex; align-items:center; gap:4px; margin-bottom:2px;">
                    ${partyStyle(partyColor['민주당'], '더불어민주당')}
                    <strong>박효빈</strong> <span class="text-xs text-gray-500">(초선)</span>
                  </div>
                </td>
              </tr>
              <tr class="border-b"><th class="bg-[#E8E8F3] text-[#7777AA] p-2 border-r">부시장</th>
                <td class="p-2 text-left text-xs">
                  <div style="margin-bottom:3px; display:flex; align-items:center; gap:4px;">
                      <span style="display:inline-block; width:50px;"><strong>행정복지</strong></span>
                      ${partyStyle(partyColor['무소속'], '무소속')}
                      고성진 <span class="text-gray-500">(20대)</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:4px;">
                      <span style="display:inline-block; width:50px;"><strong>경제문화</strong></span>
                      ${partyStyle(partyColor['무소속'], '무소속')}
                      우진현 <span class="text-xs text-gray-500">(7대)</span>
                  </div>
                </td>
              </tr>
              
              ${generateFoldingContent('folding-council', '시의회', cityCouncilData)}
              ${generateFoldingContent('folding-assembly', '국회의원', nationalAssemblyData)}
              ${generateFoldingContent('folding-district-chief', '구청장', districtChiefData)}
              
              <tr class="border-b"><th class="bg-[#E8E8F3] text-[#7777AA] p-2 border-r">교육감</th>
                <td class="p-2 text-left">
                  <div style="display:flex; align-items:center; gap:4px;">
                      ${partyStyle('#79D2CC', '진보')} <!-- Custom color badge for Jinbo -->
                      이남현 <span class="text-xs text-gray-500">(초선)</span>
                  </div>
                </td>
              </tr>
              <tr class="border-b"><th class="bg-[#E8E8F3] text-[#7777AA] p-2 border-r">상징</th>
                <td class="p-2 text-left text-xs">
                  <div><strong>시화</strong> 해바라기</div>
                  <div><strong>시목</strong> 오동나무</div>
                  <div><strong>시조</strong> 기러기</div>
                  <div><strong>시가</strong> 효빈시민찬가</div>
                </td>
              </tr>
              <tr class="border-b"><th class="bg-[#E8E8F3] text-[#7777AA] p-2 border-r">지역번호</th><td class="p-2">079</td></tr>
              <tr class="border-b"><th class="bg-[#E8E8F3] text-[#7777AA] p-2 border-r">IATA 코드</th><td class="p-2">HYB</td></tr>
              <tr class="border-b"><th class="bg-[#EE88F3] text-[#7777AA] p-2 border-r">ISO 3166-2</th><td class="p-2">KR-79</td></tr>
              <!-- 인포박스 데이터 끝 -->
          </tbody>
      </table>
      
      <!-- 지도 (인포박스 아래에 별도 셀로 삽입) -->
      <div style="width: 100%; margin-top: 10px;">
        <img src="https://placehold.co/430x200/cccccc/000000?text=지도+자리" alt="지도 자리" style="width:100%; display:block;">
      </div>
    </div>
    `;
    
    // --- Detailed Administrative History Matrix Table HTML ---
    const ADMIN_HISTORY_TABLE = `
<h3 id="s-13-1" class="wiki-h3">13.1. 전체 행정구역 변천사</h3>
<table class="wiki-table w-full text-sm border-collapse border border-gray-300 my-4 text-center admin-history-table" style="min-width: 100%;">
    <thead class="bg-gray-100">
        <tr>
            <th class="border p-2" colspan="5" style="background-color: #E8E8F3; color: #7777AA;">효빈광역시 행정구역 변천사 (지역별)</th>
        </tr>
        <tr>
            <th class="border p-2" style="width: 10%; background-color: #f2f2f2;">지역 구분</th>
            <th class="border p-2" style="width: 25%; background-color: #f2f2f2;">시내 지역</th>
            <th class="border p-2" style="width: 25%; background-color: #f2f2f2;">탄성 지역</th>
            <th class="border p-2" style="width: 20%; background-color: #f2f2f2;">서목 지역</th>
            <th class="border p-2" style="width: 20%; background-color: #f2f2f2;">도향 지역</th>
        </tr>
    </thead>
    <tbody>
        <!-- 구한말 / 1896년 -->
        <tr>
            <th class="border p-1 bg-[#f2f2f2]" rowspan="2">구한말</th>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>효빈군 (孝彬郡)
            </td>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>탄성군 (彈城郡)
            </td>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>선곡군 남내면 (選曲郡 南內面)
            </td>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>약산군 향리면, 정선면, 근원면 (藥山郡 香里面, 井扇面, 芹原面)
            </td>
        </tr>
        <tr>
            <td class="border p-1" style="vertical-align: top; font-size: 0.8em; color: #777;">1896</td>
            <td class="border p-1" style="vertical-align: top; font-size: 0.8em; color: #777;">
                1896<br>
                덕빈북도 탄성군 도진면 (挑眞面)
                <hr style="margin: 3px 0; border: 0; border-top: 1px solid #ddd;">
                덕빈북도 탄성군 야진면, 서면, 서목면 (野津面, 西面, 西목面)
            </td>
            <td class="border p-1" colspan="2" style="vertical-align: top; font-size: 0.8em; color: #777;">
                1896
            </td>
        </tr>
        
        <!-- 일제 강점기 / 1914년 -->
        <tr>
            <th class="border p-1 bg-[#f2f2f2]" rowspan="2">일제 강점기</th>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>효빈군 (孝彬郡)
            </td>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>탄성군 (彈城郡)
            </td>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>선곡군 서목면, 야진면 (選곡郡 西목面, 野津面)
            </td>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>약산군 도향면, 정근면 (藥산郡 挑香面, 井芹面)
            </td>
        </tr>
        <tr>
            <td class="border p-1" colspan="4" style="vertical-align: top; font-size: 0.8em; color: #777;">1914 (부군면 통폐합)</td>
        </tr>
        
        <!-- 일제 강점기 / 1935년 -->
        <tr>
            <th class="border p-1 bg-[#f2f2f2]" rowspan="2">일제 강점기 (승격)</th>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>효빈부 (孝彬부)
            </td>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>탄성군 (彈城郡)
            </td>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>선곡군 서목면, 야진면 (選曲郡 西목面, 野津面)
            </td>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>약산군 도향면, 정근면 (藥山郡 挑香面, 井芹面)
            </td>
        </tr>
        <tr>
            <td class="border p-1" colspan="4" style="vertical-align: top; font-size: 0.8em; color: #777;">1935 (효빈읍이 효빈부로 승격)</td>
        </tr>
        
        <!-- 대한민국 / 1949년 -->
        <tr>
            <th class="border p-1 bg-[#f2f2f2]" rowspan="6">대한민국</th>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>효빈시 (孝彬시)
            </td>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>탄성군 (彈城郡)
            </td>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>탄성군 서목면, 야진읍
            </td>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>약산군 도향면, 정근면
            </td>
        </tr>
        <tr>
            <td class="border p-1" style="vertical-align: top; font-size: 0.8em; color: #777;">1949</td>
            <td class="border p-1" style="vertical-align: top; font-size: 0.8em; color: #777;">1949</td>
            <td class="border p-1" style="vertical-align: top; font-size: 0.8em; color: #777;">1963</td>
            <td class="border p-1" style="vertical-align: top; font-size: 0.8em; color: #777;">1980</td>
        </tr>
        
        <!-- 대한민국 / 1981년 -->
        <tr>
            <td class="border p-1" style="vertical-align: top;">
                효빈직할시 (孝彬直轄市)
            </td>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>탄성군 (彈城郡)
            </td>
            <td class="border p-1" colspan="2" style="vertical-align: top;">
                덕빈북도 약산군 도향면, 정근면
            </td>
        </tr>
        <tr>
            <td class="border p-1" style="vertical-align: top; font-size: 0.8em; color: #777;">1981</td>
            <td class="border p-1" style="vertical-align: top; font-size: 0.8em; color: #777;">1981</td>
            <td class="border p-1" colspan="2" style="vertical-align: top; font-size: 0.8em; color: #777;">1981</td>
        </tr>
        
        <!-- 대한민국 / 1986년 -->
        <tr>
            <td class="border p-1" style="vertical-align: top;">
                효빈직할시 (孝彬直轄市)
            </td>
            <td class="border p-1" style="vertical-align: top;">
                덕빈북도<br>탄성군 (彈城郡)
            </td>
            <td class="border p-1" colspan="2" style="vertical-align: top;">
                [변동 없음]
            </td>
        </tr>
        <tr>
            <td class="border p-1" colspan="4" style="vertical-align: top; font-size: 0.8em; color: #777;">1995 (효빈직할시가 효빈광역시로 승격, 탄성군 편입, 청엽구 분구 등)</td>
        </tr>

    </tbody>
</table>
`;
    // -----------------------------------------------------------------
    
    // --- Detailed Chronological History Table HTML (NEW) ---
    const HISTORY_TIMELINE_TABLE = `
<h3 id="s-3-4" class="wiki-h3">3.4. 연혁 상세</h3>
<table class="wiki-table w-full text-sm border-collapse border border-gray-300 my-4 text-left admin-timeline-table" style="min-width: 100%;">
    <thead class="bg-[#E8E8F3]">
        <tr>
            <th class="border p-2 w-[80px] text-[#7777AA] text-center">연도</th>
            <th class="border p-2 text-[#7777AA] text-center">내용</th>
        </tr>
    </thead>
    <tbody>
        <tr><td class="border p-2 text-center font-bold">1914</td><td class="border p-2">부군면 통폐합으로 효빈군+탄성군 합군</td></tr>
        <tr><td class="border p-2 text-center font-bold">1931</td><td class="border p-2">효빈면이 효빈읍으로 승격</td></tr>
        <tr><td class="border p-2 text-center font-bold">1935</td><td class="border p-2">효빈읍이 효빈부로 승격 후 분리, 잔여지역은 탄성군으로 변경</td></tr>
        <tr><td class="border p-2 text-center font-bold">1941</td><td class="border p-2">사능면 천석리, 내조리, 사능리, 입리, 원리, 동리리 편입</td></tr>
        <tr><td class="border p-2 text-center font-bold">1942</td><td class="border p-2">사능면 월천, 박산, 신흥리 및 어간면 항리 일부 편입 (항동1가 일부 및 항동3가)</td></tr>
        <tr><td class="border p-2 text-center font-bold">1945</td><td class="border p-2">청엽면 신덕리, 사가당리, 등리 편입</td></tr>
        <tr><td class="border p-2 text-center font-bold">1946</td><td class="border p-2">사능면 운양리 편입</td></tr>
        <tr><td class="border p-2 text-center font-bold">1949</td><td class="border p-2">효빈부 → <strong>효빈시</strong> 변경 및 사능면 잔여지역 편입</td></tr>
        <tr><td class="border p-2 text-center font-bold">1955</td><td class="border p-2">청엽면, 어간면 전체 편입</td></tr>
        <tr><td class="border p-2 text-center font-bold">1957</td><td class="border p-2">시청 이전 (중구 중앙로 (현 중앙동 사무소) → 중보로)</td></tr>
        <tr><td class="border p-2 text-center font-bold">1963</td><td class="border p-2">구제 시행 (중구, 남구, 서구) 및 고송면 과진리, 사복리, 청덕리 편입, 창전면 전역 편입, 탄성군 이자면 이자읍 승격 및 선곡군 야진읍 편입, 탄성면 탄성읍 승격</td></tr>
        <tr><td class="border p-2 text-center font-bold">1971</td><td class="border p-2">고송면, 당가면 전역 편입 및 <strong>북구 신설</strong>, 탄성군 안천면 안천읍 승격 및 선곡군 서목면, 야진면 편입</td></tr>
        <tr><td class="border p-2 text-center font-bold">1973</td><td class="border p-2">중수면 전역 편입 및 <strong>동구 신설</strong>, 흑택면 만서리, 시로리, 광정리 편입</td></tr>
        <tr><td class="border p-2 text-center font-bold">1979</td><td class="border p-2"><strong>청엽구 신설</strong>, 탄성군 안천읍이 <strong>안천시</strong>로 승격, 이자읍에 고해면 남동, 월삼, 능릉리 편입, 이와리를 고해면으로 이동</td></tr>
        <tr><td class="border p-2 text-center font-bold">1980</td><td class="border p-2">안천시에 소원면 천본, 광상, 신, 천문리 및 도변면 창건리, 이십기리 편입</td></tr>
        <tr><td class="border p-2 text-center font-bold">1981</td><td class="border p-2">이자읍 앵내리를 도변면으로 편입, <strong>효빈직할시로 승격</strong></td></tr>
        <tr><td class="border p-2 text-center font-bold">1983</td><td class="border p-2">안천시가 효빈직할시로 편입, 이자읍 편입 및 <strong>안천구 신설</strong></td></tr>
        <tr><td class="border p-2 text-center font-bold">1986</td><td class="border p-2">약산군 도향면, 정근면이 탄성군으로 편입, 안천구 이자출장소 설치</td></tr>
        <tr><td class="border p-2 text-center font-bold">1989</td><td class="border p-2">탄성군 고해면이 고해읍으로 승격</td></tr>
        <tr><td class="border p-2 text-center font-bold">1995</td><td class="border p-2"><strong>효빈광역시로 변경</strong> 및 탄성군 편입 및 청엽구 일부를 <strong>창전구</strong>로 분리 신설</td></tr>
        <tr><td class="border p-2 text-center font-bold">1996</td><td class="border p-2">도변면 → 도변읍 승격</td></tr>
        <tr><td class="border p-2 text-center font-bold">2003</td><td class="border p-2">서목면 → 서목읍 승격</td></tr>
        <tr><td class="border p-2 text-center font-bold">2004</td><td class="border p-2">광역시청을 중구 중보로에서 북구 고송동으로 이전</td></tr>
    </tbody>
</table>
`;
    // -----------------------------------------------------------------
    
    // --- New City Structure Table ---
    const CITY_STRUCTURE_TABLE = `
<table class="wiki-table w-full text-sm border-collapse border border-gray-300 my-4 text-center city-structure-table" style="min-width: 100%;">
    <thead class="bg-gray-100">
        <tr class="bg-[#E8E8F3]">
            <th class="border p-2 text-[#7777AA] w-[10%]">지역 구분</th>
            <th class="border p-2 text-[#373a3c]">도심</th>
            <th class="border p-2 text-[#373a3c]">부도심</th>
            <th class="border p-2 text-[#373a3c]">지역중심</th>
            <th class="border p-2 text-[#373a3c]">번화가</th>
            <th class="border p-2 text-[#373a3c]">신규 택지</th>
            <th class="border p-2 text-[#373a3c]">읍면 상권</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <th class="border p-1 bg-[#f8f9fa]">중구</th>
            <td class="border p-1" rowspan="2">중앙로, 중보로<br>(원도심)</td>
            <td class="border p-1">덕현지구, 사가당동<br>(역전지구)</td>
            <td class="border p-1">당선동</td>
            <td class="border p-1">중앙로 & 중보로</td>
            <td class="border p-1" rowspan="2">쌍엽지구</td>
            <td class="border p-1">-</td>
        </tr>
        <tr>
            <th class="border p-1 bg-[#f8f9fa]">동구</th>
            <td class="border p-1">과진지구</td>
            <td class="border p-1">내조동</td>
            <td class="border p-1">효빈 대학교 대학로</td>
            <td class="border p-1">-</td>
        </tr>
        <tr>
            <th class="border p-1 bg-[#f8f9fa]">서구</th>
            <td class="border p-1">고송신도시</td>
            <td class="border p-1">중수지구</td>
            <td class="border p-1">사복동</td>
            <td class="border p-1">효빈역</td>
            <td class="border p-1">소장지구 (예정)</td>
            <td class="border p-1">-</td>
        </tr>
        <tr>
            <th class="border p-1 bg-[#f8f9fa]">남구</th>
            <td class="border p-1">평당신도시</td>
            <td class="border p-1">항동물류지구</td>
            <td class="border p-1">오내동</td>
            <td class="border p-1">고송 교차로역</td>
            <td class="border p-1">청덕지구</td>
            <td class="border p-1">-</td>
        </tr>
        <tr>
            <th class="border p-1 bg-[#f8f9fa]">북구</th>
            <td class="border p-1">청엽지구</td>
            <td class="border p-1">우전지구</td>
            <td class="border p-1">입희동</td>
            <td class="border p-1">중수역</td>
            <td class="border p-1">월천박산지구</td>
            <td class="border p-1">-</td>
        </tr>
        <tr>
            <th class="border p-1 bg-[#f8f9fa]">청엽구</th>
            <td class="border p-1">안천지구</td>
            <td class="border p-1">창전지구</td>
            <td class="border p-1">어간지구</td>
            <td class="border p-1">평당 신시가지</td>
            <td class="border p-1">효빈 동신도시</td>
            <td class="border p-1">-</td>
        </tr>
        <tr>
            <th class="border p-1 bg-[#f8f9fa]">창전구</th>
            <td class="border p-1" colspan="2">-</td>
            <td class="border p-1">비마-사노지구</td>
            <td class="border p-1">청엽구청 부근</td>
            <td class="border p-1">흑택지구</td>
            <td class="border p-1">-</td>
        </tr>
        <tr>
            <th class="border p-1 bg-[#f8f9fa]">안천구</th>
            <td class="border p-1" colspan="2">-</td>
            <td class="border p-1">칠심동</td>
            <td class="border p-1">안천역</td>
            <td class="border p-1">앵내지구</td>
            <td class="border p-1">-</td>
        </tr>
        <tr>
            <th class="border p-1 bg-[#f8f9fa]">탄성군</th>
            <td class="border p-1" colspan="3">-</td>
            <td class="border p-1">이자역-이자공원역</td>
            <td class="border p-1">-</td>
            <td class="border p-1">탄성읍, 서목읍, 고해읍, 소원면, 도변읍 (흑택면 포함)</td>
        </tr>
        <tr>
            <th class="border p-1 bg-[#7777AA] text-white">산업단지</th>
            <td class="border p-1" colspan="6" style="text-align: left;">
                효빈산단 (신흥동, 포장동), 서증공단, 평전공단, 뇌전공업지구, 광정 공업지구
            </td>
        </tr>
    </tbody>
</table>
`;

    // --- Rail Network Table HTML (NEW) ---
    const RAIL_NETWORK_TABLE = `
<table class="wiki-table w-full text-sm border-collapse border border-gray-300 my-4 text-center rail-network-table" style="min-width: 100%;">
    <thead class="bg-[#E8E8F3]">
        <tr>
            <th class="border p-2" colspan="3" style="background-color: #7777AA; color: white;">효빈광역시 관내 국가 철도</th>
        </tr>
        <tr>
            <th class="border p-2" style="width: 20%; background-color: #f2f2f2;">노선</th>
            <th class="border p-2" style="width: 20%; background-color: #f2f2f2;">등급</th>
            <th class="border p-2" style="width: 60%; background-color: #f2f2f2;">탑승역 (관내 행선지)</th>
        </tr>
    </thead>
    <tbody>
        <tr class="bg-[#f8f9fa]"><th class="border p-1 text-left" colspan="3">고속철도</th></tr>
        <tr>
            <td class="border p-1">빈효고속선</td>
            <td class="border p-1">
                <span style="background-color: #E61E2B; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px;">KTX</span><br>
                <span style="background-color: #004EA2; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-top: 2px; display: inline-block;">KTX 산천</span>
            </td>
            <td class="border p-1 text-left">
                효빈역, 안천역 (일부 정차)<br>
                <small class="text-gray-600">(행선지: 서울 · 천주 · 광주송정 · 빈주 · 서해 방면)</small>
            </td>
        </tr>
        <tr>
            <td class="border p-1">빈효고속선</td>
            <td class="border p-1">
                <span style="background-color: #61A825; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px;">SRT</span>
            </td>
            <td class="border p-1 text-left">
                효빈역, 안천역<br>
                <small class="text-gray-600">(행선지: 수서 · 광주송정 방면)</small>
            </td>
        </tr>
        <tr class="bg-[#f8f9fa]"><th class="border p-1 text-left" colspan="3">일반철도</th></tr>
        <tr>
            <td class="border p-1">빈효선 · 강빈선</td>
            <td class="border p-1">
                <span style="background-color: #E61E2B; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px;">ITX-새마을</span>
            </td>
            <td class="border p-1 text-left">
                효빈역 · 안천역, 효빈항역, 이자역<br>
                <small class="text-gray-600">(행선지: 서울 · 광주송정 · 빈주 · 서해 방면)</small>
            </td>
        </tr>
        <tr>
            <td class="border p-1">빈효선 · 강빈선</td>
            <td class="border p-1">
                <span style="background-color: #004EA2; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px;">ITX-새마을</span>
            </td>
            <td class="border p-1 text-left">
                북효빈역, 효빈역<br>
                <small class="text-gray-600">(행선지: 강주 · 빈주 (부산) 방면)</small>
            </td>
        </tr>
        <tr>
            <td class="border p-1">빈효선 · 강빈선</td>
            <td class="border p-1">무궁화호</td>
            <td class="border p-1 text-left">
                효빈역 · 안천역, 효빈항역, 고해역, 이자역<br>
                <small class="text-gray-600">(행선지: 서울 · 광주송정 · 빈주 · 서해 방면)</small>
            </td>
        </tr>
        <tr>
            <td class="border p-1">빈효선 · 강빈선</td>
            <td class="border p-1">무궁화호</td>
            <td class="border p-1 text-left">
                북효빈역, 효빈역<br>
                <small class="text-gray-600">(행선지: 강주 · 빈주 (부산) 방면)</small>
            </td>
        </tr>
        <tr>
            <td class="border p-1">내천선 · 안빈선</td>
            <td class="border p-1" colspan="2" style="text-align: left;">
                <span class="text-red-600 font-bold">노선 예정 및 계획 중</span>
            </td>
        </tr>
    </tbody>
</table>
`;
    // -----------------------------------------------------------------


    const initialData = {
      '효빈광역시': {
        content: `
          <!-- FINAL_LAYOUT_V29_TRAFFIC_TABLE -->
          
          <h1 style="font-size: 2.5rem; font-weight: 800; color: #222; margin-bottom: 5px; line-height: 1.2;">
              효빈광역시
              <span style="font-size: 1.5rem; font-weight: normal; color: #777; margin-left: 10px;">(孝彬廣域市)</span>
          </h1>

          <!-- 2. 분류 박스 (Floats naturally below the header) -->
          <div class="wiki-category-box" style="border: 1px solid #ccc; padding: 8px 12px; margin-bottom: 10px; border-radius: 4px; background-color: #fcfcfc; font-size: 0.9rem; color: #555;">
             <strong style="color: #373a3c;">분류:</strong> 
             <a href="#" data-wiki-title="효빈광역시" class="text-[#0645ad] hover:underline" style="margin-left: 5px;">효빈광역시</a> <span style="color:#ccc;">|</span>
             <a href="#" data-wiki-title="덕빈권" class="text-[#0645ad] hover:underline" style="margin-left: 5px;">덕빈권</a> <span style="color:#ccc;">|</span>
             <a href="#" data-wiki-title="대한민국의 광역자치단체" class="text-[#0645ad] hover:underline" style="margin-left: 5px;">대한민국의 광역자치단체</a> <span style="color:#ccc;">|</span>
             <a href="#" data-wiki-title="1981년 설치된 행정구역" class="text-[#0645ad] hover:underline" style="margin-left: 5px;">1981년 설치된 행정구역</a>
          </div>
          
          <!-- 1. Infobox (Floating Right, contains all political/admin data) - MOVED DOWN -->
          ${WIKI_HEADER_TABLE_INTEGRATED}

          <!-- 3. TOC Container (Placed inline, will flow left of the floating infobox) -->
          <div class="toc-container toc-container-top inline-block border border-[#ccc] bg-[#f8f9fa] p-3 mb-4 min-w-[200px] rounded">
            <div class="toc-title font-bold text-center mb-2 border-b pb-1">목차</div>
            <ul class="toc-list text-sm pl-2 space-y-1 list-none">
              <li><a href="#s-1" class="text-[#0645ad] hover:underline">1.</a> <a href="#s-1" class="text-black hover:underline">개요</a></li>
              <li><a href="#s-2" class="text-[#0645ad] hover:underline">2.</a> <a href="#s-2" class="text-black hover:underline">상징</a>
                <ul class="toc-list-sub pl-4 space-y-1 list-none">
                    <li><a href="#s-2-1" class="text-[#0645ad] hover:underline">2.1.</a> <a href="#s-2-1" class="text-black hover:underline">휘장</a></li>
                    <li><a href="#s-2-2" class="text-[#0645ad] hover:underline">2.2.</a> <a href="#s-2-2" class="text-black hover:underline">슬로건</a></li>
                    <li><a href="#s-2-3" class="text-[#0645ad] hover:underline">2.3.</a> <a href="#s-2-3" class="text-black hover:underline">마스코트</a></li>
                </ul>
              </li>
              <li><a href="#s-3" class="text-[#0645ad] hover:underline">3.</a> <a href="#s-3" class="text-black hover:underline">역사</a>
                <ul class="toc-list-sub pl-4 space-y-1 list-none">
                    <li><a href="#s-3-1" class="text-[#0645ad] hover:underline">3.1.</a> <a href="#s-3-1" class="text-black hover:underline">조선시대</a></li>
                    <li><a href="#s-3-2" class="text-[#0645ad] hover:underline">3.2.</a> <a href="#s-3-2" class="text-black hover:underline">일제강점기~현대</a></li>
                </ul>
              </li>
              <li><a href="#s-4" class="text-[#0645ad] hover:underline">4.</a> <a href="#s-4" class="text-black hover:underline">지리</a>
                <ul class="toc-list-sub pl-4 space-y-1 list-none">
                    <li><a href="#s-4-1" class="text-[#0645ad] hover:underline">4.1.</a> <a href="#s-4-1" class="text-black hover:underline">자연환경</a></li>
                    <li><a href="#s-4-2" class="text-[#0645ad] hover:underline">4.2.</a> <a href="#s-4-2" class="text-black hover:underline">기후</a></li>
                    <li><a href="#s-4-3" class="text-[#0645ad] hover:underline">4.3.</a> <a href="#s-4-3" class="text-black hover:underline">인구</a></li>
                </ul>
              </li>
              <li><a href="#s-5" class="text-[#0645ad] hover:underline">5.</a> <a href="#s-5" class="text-black hover:underline">도시구조</a></li>
              <li><a href="#s-6" class="text-[#0645ad] hover:underline">6.</a> <a href="#s-6" class="text-black hover:underline">교통</a>
                <ul class="toc-list-sub pl-4 space-y-1 list-none">
                    <li><a href="#s-6-1" class="text-[#0645ad] hover:underline">6.1.</a> <a href="#s-6-1" class="text-black hover:underline">철도</a>
                      <ul class="toc-list-sub-2 pl-4 space-y-1 list-none">
                          <li><a href="#s-6-1-1" class="text-[#0645ad] hover:underline">6.1.1.</a> <a href="#s-6-1-1" class="text-black hover:underline">일반철도 및 고속철도</a></li>
                          <li><a href="#s-6-1-2" class="text-[#0645ad] hover:underline">6.1.2.</a> <a href="#s-6-1-2" class="text-black hover:underline">도시철도/광역철도</a></li>
                      </ul>
                    </li>
                    <li><a href="#s-6-2" class="text-[#0645ad] hover:underline">6.2.</a> <a href="#s-6-2" class="text-black hover:underline">도로권역</a></li>
                    <li><a href="#s-6-3" class="text-[#0645ad] hover:underline">6.3.</a> <a href="#s-6-3" class="text-black hover:underline">버스</a>
                      <ul class="toc-list-sub-2 pl-4 space-y-1 list-none">
                          <li><a href="#s-6-3-1" class="text-[#0645ad] hover:underline">6.3.1.</a> <a href="#s-6-3-1" class="text-black hover:underline">시내버스</a></li>
                          <li><a href="#s-6-3-2" class="text-[#0645ad] hover:underline">6.3.2.</a> <a href="#s-6-3-2" class="text-black hover:underline">시외/고속버스</a></li>
                      </ul>
                    </li>
                    <li><a href="#s-6-4" class="text-[#0645ad] hover:underline">6.4.</a> <a href="#s-6-4" class="text-black hover:underline">항만</a></li>
                    <li><a href="#s-6-5" class="text-[#0645ad] hover:underline">6.5.</a> <a href="#s-6-5" class="text-black hover:underline">항공</a></li>
                </ul>
              </li>
              <li><a href="#s-7" class="text-[#0645ad] hover:underline">7.</a> <a href="#s-7" class="text-black hover:underline">경제</a>
                <ul class="toc-list-sub pl-4 space-y-1 list-none">
                    <li><a href="#s-7-1" class="text-[#0645ad] hover:underline">7.1.</a> <a href="#s-7-1" class="text-black hover:underline">산업</a></li>
                    <li><a href="#s-7-2" class="text-[#0645ad] hover:underline">7.2.</a> <a href="#s-7-2" class="text-black hover:underline">상권</a></li>
                </ul>
              </li>
              <li><a href="#s-8" class="text-[#0645ad] hover:underline">8.</a> <a href="#s-8" class="text-black hover:underline">관광</a></li>
              <li><a href="#s-9" class="text-[#0645ad] hover:underline">9.</a> <a href="#s-9" class="text-black hover:underline">교육</a></li>
              <li><a href="#s-10" class="text-[#0645ad] hover:underline">10.</a> <a href="#s-10" class="text-black hover:underline">생활문화</a>
                <ul class="toc-list-sub pl-4 space-y-1 list-none">
                    <li><a href="#s-10-1" class="text-[#0645ad] hover:underline">10.1.</a> <a href="#s-10-1" class="text-black hover:underline">효빈광역시청</a></li>
                    <li><a href="#s-10-2" class="text-[#0645ad] hover:underline">10.2.</a> <a href="#s-10-2" class="text-black hover:underline">언론</a></li>
                    <li><a href="#s-10-3" class="text-[#0645ad] hover:underline">10.3.</a> <a href="#s-10-3" class="text-black hover:underline">의료기관</a></li>
                    <li><a href="#s-10-4" class="text-[#0645ad] hover:underline">10.4.</a> <a href="#s-10-4" class="text-black hover:underline">스포츠</a></li>
                </ul>
              </li>
              <li><a href="#s-11" class="text-[#0645ad] hover:underline">11.</a> <a href="#s-11" class="text-black hover:underline">정치</a>
                <ul class="toc-list-sub pl-4 space-y-1 list-none">
                    <li><a href="#s-11-1" class="text-[#0645ad] hover:underline">11.1.</a> <a href="#s-11-1" class="text-black hover:underline">국회의원 목록</a></li>
                    <li><a href="#s-11-2" class="text-[#0645ad] hover:underline">11.2.</a> <a href="#s-11-2" class="text-black hover:underline">역대 민선 효빈광역시장</a></li>
                    <li><a href="#s-11-3" class="text-[#0645ad] hover:underline">11.3.</a> <a href="#s-11-3" class="text-black hover:underline">최근 선거</a>
                      <ul class="toc-list-sub-2 pl-4 space-y-1 list-none">
                          <li><a href="#s-11-3-1" class="text-[#0645ad] hover:underline">11.3.1.</a> <a href="#s-11-3-1" class="text-black hover:underline">대통령 선거</a></li>
                          <li><a href="#s-11-3-2" class="text-[#0645ad] hover:underline">11.3.2.</a> <a href="#s-11-3-2" class="text-black hover:underline">총선</a></li>
                          <li><a href="#s-11-3-3" class="text-[#0645ad] hover:underline">11.3.3.</a> <a href="#s-11-3-3" class="text-black hover:underline">지선</a></li>
                      </ul>
                    </li>
                    <li><a href="#s-11-4" class="text-[#0645ad] hover:underline">11.4.</a> <a href="#s-11-4" class="text-black hover:underline">설명</a></li>
                </ul>
              </li>
              <li><a href="#s-12" class="text-[#0645ad] hover:underline">12.</a> <a href="#s-12" class="text-black hover:underline">군사</a></li>
              <li><a href="#s-13" class="text-[#0645ad] hover:underline">13.</a> <a href="#s-13" class="text-black hover:underline">하위 행정 구역</a>
                <ul class="toc-list-sub pl-4 space-y-1 list-none">
                    <li><a href="#s-13-1" class="text-[#0645ad] hover:underline">13.1.</a> <a href="#s-13-1" class="text-black hover:underline">전체 행정구역 변천사</a></li>
                </ul>
              </li>
              <li><a href="#s-14" class="text-[#0645ad] hover:underline">14.</a> <a href="#s-14" class="text-black hover:underline">여담</a></li>
              <li><a href="#s-15" class="text-[#0645ad] hover:underline">15.</a> <a href="#s-15" class="text-black hover:underline">협력 도시</a>
                <ul class="toc-list-sub pl-4 space-y-1 list-none">
                    <li><a href="#s-15-1" class="text-[#0645ad] hover:underline">15.1.</a> <a href="#s-15-1" class="text-black hover:underline">자매결연 도시</a></li>
                </ul>
              </li>
              <li><a href="#s-16" class="text-[#0645ad] hover:underline">16.</a> <a href="#s-16" class="text-black hover:underline">효빈광역시 지역을 본관으로 한 성씨</a></li>
              <li><a href="#s-17" class="text-[#0645ad] hover:underline">17.</a> <a href="#s-17" class="text-black hover:underline">둘러보기</a></li>
              <li><a href="#s-18" class="text-[#0645ad] hover:underline">18.</a> <a href="#s-18" class="text-black hover:underline">각주</a></li>
            </ul>
          </div>

          <h2 id="s-1" class="wiki-h2"><a href="#s-1" class="text-black no-underline">1.</a> 개요</h2>
          <p>대한민국의 광역시.  서부와 남부 북부에는 서해가 펼쳐져 있고, 동쪽으로는 덕빈북도와 접한다. 덕빈지역의 최대도시이자 효빈권의 중심도시이다. 효빈은 인접한 선곡군, 약산시, 천주시, 치원군, 기도군까지 효빈권으로 설정될 만큼 영향력을 지니며, 특히 덕북 제2의 도시인 천주시에도 영향을 주고 광역철도로 통행이 가능한 만큼 교류가 매우 활발한 편。</p>
          <p>덕북 제1도시인 빈주도시권보다 큰 효빈도시권을 형성하고 있으며, 철도교통 및 해상교통이 발달하고 서비스업과 공업이 고루고루 발달했다。</p>
          <p>여담으로 효빈광역시시장은 민선 8기 현재 더불어민주당 박효빈으로, 도시이름과 시장이름이 같은 유일한 사례라고 한다. 그로인해 시장은 시정을 처음으로 시작한 22년에 “저 뿐만이 아닌 여러분 모두의 효빈광역시로 나아가겠습니다!”라는 말을 해야 했을 정도라고。</p>

          <h2 id="s-2" class="wiki-h2"><a href="#s-2" class="text-black no-underline">2.</a> 상징</h2>

          <h3 id="s-2-1" class="wiki-h3">2.1. 휘장</h3>
          <div style="border: 1px solid #ccc; margin-bottom: 20px; border-radius: 4px; overflow: hidden; background-color: #f8f8f8;">
              <table class="wiki-table" style="width: 100%; margin: 0; border: none; background-color: white;">
                  <tr>
                      <td style="width: 120px; text-align: center; border: 1px solid #ddd; padding: 10px; vertical-align: middle;">
                          <img src="https://i.imgur.com/iYcyOlz.png" alt="효빈광역시 휘장" style="max-width: 100px; height: auto; display: block; margin: 0 auto; border: 1px solid #ddd; border-radius: 3px; object-fit: contain;">
                      </td>
                      <td style="border: 1px solid #ddd; padding: 10px; vertical-align: top; font-size: 0.95rem;">
                          <p>바다와 3면이 접해있는 항만 도시의 특성을 살려 하부는 푸른 물결 이미지를, 상부는 효빈의 초성 'ㅂ'을 노란색(밝은 미래)으로, 이를 감싸는 파란색 'ㅎ' 형상으로 구성했다.</p>
                      </td>
                  </tr>
              </table>
          </div>

          <h3 id="s-2-2" class="wiki-h3">2.2. 슬로건</h3>
          <div style="border: 1px solid #ccc; margin-bottom: 20px; border-radius: 4px; overflow: hidden; background-color: #f8f8f8;">
              <table class="wiki-table" style="width: 100%; margin: 0; border: none; background-color: white;">
                  <tr>
                      <td style="width: 120px; text-align: center; border: 1px solid #ddd; padding: 10px; vertical-align: middle;">
                          <img src="https://imgur.com/neRZHMu" alt="효빈 시민의 밝은 미래를 함께 열어간다 슬로건 이미지" style="max-width: 100px; height: auto; display: block; margin: 0 auto; border: 1px solid #ddd; border-radius: 3px; object-fit: contain;">
                      </td>
                      <td style="border: 1px solid #ddd; padding: 10px; vertical-align: top; font-size: 0.95rem;">
                          <p><strong>"효빈 시민의 밝은 미래를 함께 열어간다"</strong> (2022년~)<br>민선 8기 박효빈 시장 취임과 함께 발표된 슬로건으로, 시민의 행복과 도시의 미래 비전을 담고 있다.</p>
                      </td>
                  </tr>
              </table>
          </div>

          <h3 id="s-2-3" class="wiki-h3">2.3. 마스코트</h3>
          <div style="border: 1px solid #ccc; margin-bottom: 20px; border-radius: 4px; overflow: hidden; background-color: #f8f8f8;">
              <table class="wiki-table" style="width: 100%; margin: 0; border: none; background-color: white;">
                  <tr>
                      <td style="width: 120px; text-align: center; border: 1px solid #ddd; padding: 10px; vertical-align: middle;">
                          <img src="https://imgur.com/rNZLrAy" alt="히버히 마스코트" style="max-width: 100px; height: auto; display: block; margin: 0 auto; border: 1px solid #ddd; border-radius: 3px; object-fit: contain;">
                      </td>
                      <td style="border: 1px solid #ddd; padding: 10px; vertical-align: top; font-size: 0.95rem;">
                          <p><strong>히버히</strong> - 효빈광역시의 시조(市鳥)인 기러기를 캐릭터화한 것이다. 밝고 희망찬 도시 이미지를 대표하며, 시의 각종 행사에서 활용되고 있다.</p>
                      </td>
                  </tr>
              </table>
          </div>

          <h2 id="s-3" class="wiki-h2"><a href="#s-3" class="text-black no-underline">3.</a> 역사</h2>
          
          <h3 id="s-3-1" class="wiki-h3">3.1. 조선시대</h3>
          <p>효빈 지역은 조선시대에는 '효빈군'과 '탄성군' 등으로 나뉘어 있었다. 이 지역은 덕빈북도 내에서도 중요한 군사적/해상 거점이었으나, 인근의 빈주(도 관아가 위치한 곳)나 덕주에 비해 상업적 중심지는 아니었다.</p>
          
          <h3 id="s-3-2" class="wiki-h3">3.2. 일제강점기 ~ 현대</h3>
          <p>일본어로는 한국어 그대로 독음되었다. 일제강점기 전에는 작은 고을은 아니었어도 천주보다 약간 크고 덕주, 빈주보다는 작은 중심적인 고을은 아니었다.</p>
          <p>1880년대 들어 개항으로 인해 점점 발달하기 시작하였고, 1883년 계미군란(빈주 전역의 군인의 난)과 계미홍수로 인한 도 관아 파괴로 인해 대체지로서 일시적으로 일본인들이 거주하기 시작한 효빈 지역에 들어서게 되었고, 그를 계기로 철도 교통도 발달하게 된다.
          이후 빈주시가 도심 복구를 하고, 광복을 지나 6.25 전쟁으로 효빈에 위치한 도청이 파괴되어 1953년 다시 도청이 빈주로 복귀하였지만 효빈 지역의 성장세는 오히려 급격하게 상승세를 유지하였고, 1929년에 이미 빈주보다 약간 더 커지게 되었다.</p>
          <p>1914년에는 부군면통폐합으로 탄성군과 통합을 하였다.</p>

          <h2 id="s-4" class="wiki-h2"><a href="#s-4" class="text-black no-underline">4.</a> 지리</h2>
          
          <h3 id="s-4-1" class="wiki-h3">4.1. 자연환경</h3>
          <p>전체적으로 산이 매우 적은 해안 반도 지형으로, 해양 산업이 발달되기 좋은 만과 반도가 많이 있다. 동쪽으로는 덕빈산맥의 지맥인 병현산(580m)이 자리 잡고 있어 동서 간의 지형적 대비가 뚜렷하며, 시내를 관통하는 <strong>효빈강</strong>은 도시의 중요한 수자원이자 생활권 경계를 이룬다.</p>
          
          <h3 id="s-4-2" class="wiki-h3">4.2. 기후</h3>
          <p>쾨펜의 기후 구분상 <strong>온난 습윤 기후(Cfa)</strong>에 속한다. 사계절이 뚜렷하다. 겨울에는 시베리아 고기압의 영향으로 춥고 건조하며, 여름에는 북태평양 고기압의 영향으로 고온다습하다. 특히 해안 지역은 내륙보다 일교차가 작은 편이다.</p>

          <h3 id="s-4-3" class="wiki-h3">4.3. 인구</h3>
          <div style="text-align: center; margin: 20px 0;">
             <figure class="wiki-figure" style="display: inline-block; border: 1px solid #ddd; padding: 5px; background: #fff;">
                 <img src="https://imgur.com/XIZfGm0" alt="효빈광역시 인구 변화 그래프" style="max-width: 400px; height: auto; display: block;" />
                 <figcaption style="font-size: 0.85em; color: #666; padding-top: 5px;">인구 변화 추이</figcaption>
             </figure>
          </div>
          <p>현재도 인구가 꾸준히 늘어나는 도시로, 서울, 부산, 인천 다음으로 인구가 많은 도시이다.</p>

          <h2 id="s-5" class="wiki-h2"><a href="#s-5" class="text-black no-underline">5.</a> 도시구조</h2>
          ${CITY_STRUCTURE_TABLE}
          <p>효빈시는 바다와 맞닿아 있고, 간척 지역이 어느 정도 존재한다. 바다와 맞닿아 있기 때문에 대부분은 평지이며, 산간 지역이 있는 곳은 정근면과 도향면, 도변읍의 포성산, 채산동과 악부동 지역 정도로 언덕이 적은 도시이다.</p>
          <p>도시 지형이 평지이다 보니 <strong>다핵 구조</strong>를 띠고 있고 도시 형성 초반에는 원도심 중심의 지역 개발이 되었지만, 현재는 각 구별로 중점 도심이 한 개 이상씩 존재한다.</p>
          <p>대표적으로 중구는 원도심, 서구는 과진동과 당선동(효빈대학교)이, 동구는 덕현동, 효빈역(사가당동), 남구는 평당지구, 항동(물류의 중심이다), 북구는 고송지구(현재 효빈에서 가장 인구가 많은 도심권이다), 중수지구가 존재하고, 청엽구에는 청엽지구, 창전구에는 창전지구, 안천구에는 안천지구와 이자출장소가 위치할 정도로 독립된 도심인 이자지구가 존재한다.</p>
          <p>이 중 중심 도시권역으로 꼽히는 도심은 원도심, 고송지구, 청엽지구, 평당신도시 4도심 체제이며, 여기에 추가로 안천지구를 넣어 5도심이라고 생각하기도 한다. 이는 안천시로 따로 시로 승격되었던 과거가 있었기에 이러한 주장이 나오는 것이고 보통은 5도심으로 구분한다.</p>
          <p>탄성군의 경우 탄성읍은 여타 군에 비해 큰 규모의 읍내를 가지고 있고, 도변읍은 그보다 더 많은 약 인구 9만으로 흑택면과 같이 도심을 이룬다.</p>

          <h2 id="s-6" class="wiki-h2"><a href="#s-6" class="text-black no-underline">6.</a> 교통</h2>
          <p>효빈은 전반적으로 철도교통 초강세를 보이고 있다. 우선, 철도망은 수도권과 견줄 정도의 이용객수를 보이는 빈효선 광역전철과 부산 1호선에 맞먹는 효빈 1호선 이용객수, 그 외에 가장 적은 이용객수를 보이는 8호선마저도 대구 3호선보다 이용객수가 많을 정도로 철도교통 및 도시철도가 정말 잘 되어있는 도시로 꼽힌다.</p>
          <p>시내 철도 교통이 매우 편한 도시로 꼽히는데, 시에서 적극적인 행정과 기업 및 시민들의 자발적인 예산 편성에 대한 도움, 박현만 시정에서의 적극적 교통 체계 구축과 대중교통 활성화를 통해 시내 궤도 교통 이용률이 타 도시 대비 매우 높은 편이다.</p>
          <p>다만 철도 및 궤도 교통이 발달한 것에 비해 도로망을 보면 알 수 있듯이 반도 지역이라는 특성과 대중교통을 더 선호하는 지역 분위기로 자동차 전용도로나 고속도로는 타 광역시 대비 적은 편이며, 고속 진출입구는 중수동 외곽의 습지동 진출입구와 평전공단 IC, 곡진 IC를 제외하고는 모두 도심에서 많이 떨어진 외곽에 있는 등 전반적으로 철도 대비 부족한 모습이다.</p>
          <p>시내 버스는 상대적으로 덜 발달하고, 도로도 대부분 격자형이긴 하나 중구 지역은 상습 정체에 시달리는 등의 문제로 인해 개선 사업을 진행 중에 있다.</p>
          <p>이 외에도 특이한 점으로 노면전차가 남아있다는 것인데, 1926년부터 계획되어 1931년 당시 서울, 부산에 이어 노면전차가 개통하였다. 서울, 부산이 노면전차가 폐지된 데에 반해 효빈전차(현 7호선)가 남아 있을 수 있던 이유는 지역 기업 회주공업 대표인 박신유 전 대표 덕분으로, 유럽 및 일본 유학으로 궤도 교통에 대한 중요성을 알고 있던 그는 전쟁 이후 복구된 전차를 운영하는 데 일부 기여하고, 1968년 서울, 부산과 함께 전차 폐지가 고려되었을 당시 그가 가지고 있던 기업 일부를 담보로 하고 직원들에게 호소하며 대통령을 설득, 협상한 끝에(당시 시민들의 전차 교통 만족도도 워낙 높았기 때문에 대통령으로서는 약간 부담이었을지도 모른다) 그가 직접 매입하여 운영하는 조건으로 폐지를 면할 수 있게 되었다.</p>
          <p>그러나 그런 효빈전차에도 1997년 외환 위기로 지역 기업의 부도 위기가 나타나면서 충격을 적지 않게 받음은 물론 2000년대 초반 시설 노후화와 시내 일부 단절 문제, 소음 문제로 폐지를 주장하는 시민 단체가 나오기도 하였고, 2006년 윤대환이 시장으로 당선되면서 비용 보조 중지는 물론 전차 폐지를 계획하는 등의 위기가 찾아왔다.<sup id="fnref-1"><a href="#fn-1">[1]</a></sup></p>
          <p>윤 시장은 시외 내 버스 회사 일가로, 광역 철도 계획 전면 중단과 지하철 폐쇄, 전차 폐지 등을 계획하였으며 이 계획이 당시 가혹 행위로 인해 목숨을 걸고 폭로하게 된 비서관의 용기 덕분에 밝혀지자, 시 전체가 매우 뒤집혀지게 되었고, 당연히 전차에 대한 만족도가 높았던 시민들이 대부분이었던지라 금세 난리가 나게 되었다.<sup id="fnref-2"><a href="#fn-2">[2]</a></sup></p>
          <p>시민들이 직접 나서서 당시 대통령과 국회의원에게 서한과 편지를 보내고 시위에 동참할 정도로 반대가 극심했고, 결정적으로 시장의 권한이라며 시위를 매우 강압적으로 저지하자 대통령이 질책할 정도였다고 하며, 2007년 1월 당시 최초로 주민 소환 여론까지 나왔다고 한다.</p>
          <p>그러다가 범죄 사실로 인해 2007년 윤 시장의 당선 무효와 2008년 박현만 시장의 복귀로 전차는 폐지를 면하였고, 운영사의 부담 감면 및 시민 편의, 지하철과 연계하여 사업 관리 편의화를 위하여 2010년 공영화하여 효빈 교통 공사가 운영하게 되었다.</p>

          <h3 id="s-6-1" class="wiki-h3">6.1. 철도</h3>
          ${RAIL_NETWORK_TABLE}
          <h4 id="s-6-1-1" class="wiki-h3">6.1.1. 일반철도 및 고속철도</h4>
          <ul class="list-disc ml-6">
            <li><strong>고속철도</strong>: 빈효고속선 (효빈역 정차)</li>
            <li><strong>일반철도</strong>: 빈효선, 강빈선, 내천선, 안빈선</li>
          </ul>

          <h4 id="s-6-1-2" class="wiki-h3">6.1.2. 도시철도/광역철도</h4>
          <ul class="list-disc ml-6">
            <li>수도권 전철에 버금가는 <strong>빈효선 광역전철</strong>이 운행 중이다.</li>
            <li>도시철도: 1~8호선 운행 중. (7호선은 노면전차, 8호선은 모노레일)</li>
            <li>부산 1호선급 이용객을 자랑하는 효빈 1호선 등이 있다.</li>
            <li>특이하게도 1931년 개통된 <strong>노면전차(현 7호선)</strong>가 폐지되지 않고 현재까지 운행 중이다.</li>
          </ul>

          <h3 id="s-6-2" class="wiki-h3">6.2. 도로권역</h3>
          <p>효빈시는 광역 교통의 중심지로, 주요 고속도로와 국도가 통과하며 인근 도시권과의 접근성이 우수하다. <br><small>(추가적인 내용은 여기에 작성될 예정입니다.)</small></p>
          
          <h3 id="s-6-3" class="wiki-h3">6.3. 버스</h3>
          <h4 id="s-6-3-1" class="wiki-h3">6.3.1. 시내버스</h4>
          <p>시내버스는 권역별 번호 체계를 따르며, 윤대환 전 시장 시절의 비리 사건 이후 준공영제가 도입되어 기사들의 친절도가 높다.</p>
          
          <h4 id="s-6-3-2" class="wiki-h3">6.3.2. 시외/고속버스</h4>
          <p>모든 택시가 <span style="color:#7777AA; font-weight:bold;">보라색(#7777AA)</span>인 것이 특징이며, 효빈 종합버스터미널은 전국 주요 도시로 향하는 시외/고속버스 노선을 운영하고 있다. <br><small>(추가적인 내용은 여기에 작성될 예정입니다.)</small></p>

          <h3 id="s-6-4" class="wiki-h3">6.4. 항만</h3>
          <p>효빈항은 대한민국 5대 무역항 중 하나로, 서해안 최대 규모의 컨테이너 물동량을 처리한다. 국제 여객선 터미널을 통해 중국 칭다오, 옌타이 등과 연결된다. 해양 물류 산업은 효빈 경제의 핵심 축 중 하나이다.</p>
          
          <h3 id="s-6-5" class="wiki-h3">6.5. 항공</h3>
          <p>효빈시는 국제선과 국내선을 모두 취급하는 <strong>효빈 국제공항(HYB)</strong>을 보유하고 있다. 주로 일본, 중국, 동남아시아 노선이 활발하며, 효빈권역 주민들의 주요 해외 관문 역할을 한다.</p>
          
          <h2 id="s-7" class="wiki-h2"><a href="#s-7" class="text-black no-underline">7.</a> 경제</h2>
          
          <h3 id="s-7-1" class="wiki-h3">7.1. 산업</h3>
          <p>2022년 기준 GRDP는 약 <strong>1,058억 달러</strong>, 1인당 GRDP는 $36,341이다. 제조업과 서비스업이 고루 발달했으며, 특히 하이테크 산업과 중공업이 경제를 이끌고 있다.</p>
          <ul class="list-disc ml-6">
              <li><strong>정밀 화학 및 소재 산업</strong>: 청엽구 해안가에 위치한 효빈공단에는 반도체 및 디스플레이 소재를 생산하는 정밀 화학 기업들의 공장이 집중되어 있다.</li>
              <li><strong>첨단 기술 및 R&D</strong>: 북구 고송지구에는 효빈과학기술원(HIST)을 중심으로 IT 및 바이오 R&D 벤처 기업들이 밀집한 <strong>효빈 테크노밸리</strong>가 조성되어 있다.</li>
              <li><strong>중공업 및 물류</strong>: 효빈항과 인접한 평전공단은 자동차 부품, 조선 기자재 등 중공업 분야의 중심지이며, 대규모 물류창고와 배후 산업단지가 해운 교통과 연계되어 있다.</li>
          </ul>

          <h3 id="s-7-2" class="wiki-h3">7.2. 상권</h3>
          <p>효빈의 금융 중심지는 원도심인 중구와 신도심인 남구 평당지구가 양분하고 있다. 특히 평당지구에는 국내외 금융 투자 기관의 지점과 대형 쇼핑몰, 호텔 등이 밀집하여 서비스업 성장을 주도하고 있다。<br><small>(추가적인 내용은 여기에 작성될 예정입니다.)</small></p>

          <h2 id="s-8" class="wiki-h2"><a href="#s-8" class="text-black no-underline">8.</a> 관광</h2>
          <p>효빈시는 해안 도시의 특성을 살린 다양한 해양 관광 자원과 역사적인 개항장 문화 자산을 보유하고 있다. <br><small>(추가적인 내용은 여기에 작성될 예정입니다.)</small></p>

          <h2 id="s-9" class="wiki-h2"><a href="#s-9" class="text-black no-underline">9.</a> 교육</h2>
          <p>국립 효빈대학교, 효빈과학기술원(HIST) 등 다수의 대학이 소재한다. <br><small>(추가적인 내용은 여기에 작성될 예정입니다.)</p>

          <h2 id="s-10" class="wiki-h2"><a href="#s-10" class="text-black no-underline">10.</a> 생활문화</h2>
          
          <h3 id="s-10-1" class="wiki-h3">10.1. 효빈광역시청</h3>
          <p>효빈광역시청은 북구 고송동에 위치하며, 현재는 민선 8기 박효빈 시장이 이끌고 있다. <br><small>(추가적인 내용은 여기에 작성될 예정입니다.)</small></p>
          
          <h3 id="s-10-2" class="wiki-h3">10.2. 언론</h3>
          <p>지역을 기반으로 하는 주요 일간지와 방송사가 위치해 있으며, 지역 정세와 문화 소식을 전달하는 중요한 역할을 한다. <br><small>(추가적인 내용은 여기에 작성될 예정입니다.)</small></p>
          
          <h3 id="s-10-3" class="wiki-h3">10.3. 의료기관</h3>
          <p>남구 엽월대학교 병원, 북구 효빈대학교 병원 등 상급종합병원이 있어 지역 주민들의 의료 서비스를 담당한다.</p>

          <h3 id="s-10-4" class="wiki-h3">10.4. 스포츠</h3>
          <p>KBO 리그 '회주 돌핀즈', K리그1 '효빈 레인보우 아쿠아드' 등의 프로 구단 연고지이다.</p>

          <h2 id="s-11" class="wiki-h2"><a href="#s-11" class="text-black no-underline">11.</a> 정치</h2>
          
          <h3 id="s-11-1" class="wiki-h3">11.1. 국회의원 목록</h3>
          <p>제22대 국회의원 총 14석 중 더불어민주당이 13석, 진보당이 1석을 차지하고 있다. <br><small>(상세 목록은 여기에 작성될 예정입니다.)</small></p>
          
          <h3 id="s-11-2" class="wiki-h3">11.2. 역대 민선 효빈광역시장</h3>
          <p>현 시장은 민선 8기 박효빈 시장이며, 도시 이름과 시장 이름이 같은 유일한 사례이다. <br><small>(역대 시장 목록은 여기에 작성될 예정입니다.)</p>
          
          <h3 id="s-11-3" class="wiki-h3">11.3. 최근 선거</h3>
          <h4 id="s-11-3-1" class="wiki-h3">11.3.1. 대통령 선거</h4>
          <p>호남 지역 못지않게 민주당계 정당 강세 지역으로, 대통령 선거에서도 해당 정당 후보에게 압도적인 지지를 보낸다. <br><small>(상세 결과는 여기에 작성될 예정입니다.)</small></p>
          
          <h4 id="s-11-3-2" class="wiki-h3">11.3.2. 총선</h4>
          <p>최근 제22대 총선에서도 더불어민주당이 13석, 진보당이 1석을 차지하며 보수 정당은 전멸했다. <br><small>(상세 결과는 여기에 작성될 예정입니다.)</small></p>
          
          <h4 id="s-11-3-3" class="wiki-h3">11.3.3. 지선</h4>
          <p>지방선거에서도 시장 및 구청장 다수가 민주당계 정당 소속이다. <br><small>(상세 결과는 여기에 작성될 예정입니다.)</p>

          <h3 id="s-11-4" class="wiki-h3">11.4. 설명</h3>
          <p>호남 지역 못지않게 <strong>민주당계 정당 강세 지역</strong>이다. 이는 과거 보수 정당 소속이었던 윤대환 전 시장의 전차 폐지 시도 및 각종 비리 사건이 결정적인 계기가 되었다.</p>

          <h2 id="s-12" class="wiki-h2"><a href="#s-12" class="text-black no-underline">12.</a> 군사</h2>
          <p>후방 지역으로 해군과 공군이 발달했다. 제71사단이 주둔했으나 이전했고, 현재는 해군기지와 제39비행단(공군)이 위치해 있다.</p>

          <h2 id="s-13" class="wiki-h2"><a href="#s-13" class="text-black no-underline">13.</a> 하위 행정 구역</h2>
          <p>효빈광역시는 <strong>8구 1군</strong> 체제이며, 시청은 북구에 위치해 있다.</p>
          
          <table class="wiki-table" style="width:100%; text-align:center; border: 1px solid #ccc; border-collapse: collapse; margin-top:10px; font-size: 0.95rem;">
            <thead>
                <tr>
                    <th colspan="2" style="background-color:#7777AA; color:white; padding: 10px; border: 1px solid #ccc; text-align: center;">
                        <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
                           <img src="${IMAGE_MAP['효빈광역시']}" alt="효빈광역시 로고" style="width: 40px; height: 40px; border-radius: 5px; object-fit: contain;">
                           <span style="font-size:1.2em;">효빈광역시의 행정구역</span>
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th style="background-color:#f8f9fa; width: 15%; padding: 10px; border: 1px solid #ccc; vertical-align: middle;">자치구<br>(8)</th>
                    <td style="padding: 15px; border: 1px solid #ccc; background: #fff;">
                        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 5px;">
                           ${districtsHtml}
                        </div>
                    </td>
                </tr>
                <tr>
                    <th style="background-color:#f8f9fa; width: 15%; padding: 10px; border: 1px solid #ccc; vertical-align: middle;">자치군<br>(1)</th>
                    <td style="padding: 15px; border: 1px solid #ccc; background: #fff;">
                        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 5px;">
                           ${countiesHtml}
                        </div>
                    </td>
                </tr>
            </tbody>
          </table>
          
          <h3 id="s-13-1" class="wiki-h3">13.1. 전체 행정구역 변천사</h3>
          ${ADMIN_HISTORY_TABLE}
          ${HISTORY_TIMELINE_TABLE}


          <h2 id="s-14" class="wiki-h2"><a href="#s-14" class="text-black no-underline">14.</a> 여담</h2>
          <p>현 시장은 민선 8기 <strong>박효빈</strong> 시장으로, 도시 이름(효빈)과 시장 이름(효빈)이 같은 유일한 사례이다.</p>

          <h2 id="s-15" class="wiki-h2"><a href="#s-15" class="text-black no-underline">15.</a> 협력 도시</h2>
          <p>애니메이션 성지나 해양 도시들과의 교류가 활발하다.</p>
          
          <h3 id="s-15-1" class="wiki-h3">15.1. 자매결연 도시</h3>
          <ul class="list-disc ml-6">
            <li><strong>일본</strong>: 누마즈시(러브라이브 선샤인), 도쿄도 시부야구(슈퍼스타), 가나자와시(하스노소라), 시가현 토요사토정(케이온) 등</li>
            <li><strong>국내</strong>: 부산 강서구, 서울 마포구, 전북 전주시 등</li>
          </ul>

          <h2 id="s-16" class="wiki-h2"><a href="#s-16" class="text-black no-underline">16.</a> 효빈광역시 지역을 본관으로 한 성씨</h2>
          <p><strong>지역 성씨</strong>: 효빈 박씨, 효빈 상씨, 탄성 장씨, 안천 우씨 등의 본관이 있다.</p>

          <h2 id="s-17" class="wiki-h2"><a href="#s-17" class="text-black no-underline">17.</a> 둘러보기</h2>
          <p><small>(둘러보기 틀은 여기에 표시될 예정입니다.)</small></p>

          <h2 id="s-18" class="wiki-h2"><a href="#s-18" class="text-black no-underline">18.</a> 각주</h2>
          <p id="fn-1" style="font-size: 0.9em; margin-bottom: 5px;">
            <sup class="foot-note-marker"><a href="#fnref-1" style="text-decoration: none;">[1]</a></sup> 물론 전술했던 것처럼, 시민 대부분은 전차 만족도가 높았고, 이런 주장을 하던 시민단체 역시 윤대환이 매수하였던 사람들이라는 것이 밝혀졌다.
          </p>
          <p id="fn-2" style="font-size: 0.9em; margin-bottom: 5px;">
            <sup class="foot-note-marker"><a href="#fnref-2" style="text-decoration: none;">[2]</a></sup> 이 사건들로 인하여 지역내 시외버스, 시내버스 회사였던 두청운수는 시민들의 불매운동과 퇴출시위로 인하여 빠르게 몰락하였고, 결국 두청운수 내에서도 분식회계 및 사내 가혹행위 등이 밝혀지자 폐업 수순에 들어갔다. 위법 행위에 동조하지 않았거나 진실을 규명했던 버스 승무사원들은 공영버스로 이직하였고, 버스들 역시 공영버스화되었다.
          </p>
        `,
        history: [{ rev: 53, user: 'System', time: new Date().toISOString(), summary: '6.1.1 문단 위에 관내 국가 철도망 표 추가 (KTX, SRT, ITX 배지 적용)' }],
        discuss: [],
        lastUpdated: new Date().toISOString()
      }
    };
    
    // Batch write for atomicity
    const batch = [];
    for (const [key, value] of Object.entries(initialData)) {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wiki_docs', key), value, { merge: true });
    }
  };

  // Navigation Handlers
  const goToMain = () => { setView('main'); setCurrentDocTitle(''); };
  const goToDoc = (title) => { setCurrentDocTitle(title); setView('doc'); };
  const goToSearch = (term) => { setSearchTerm(term); setView('search'); };
  
  // Random Doc
  const goToRandom = () => {
    const keys = Object.keys(docs);
    if (keys.length > 0) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      goToDoc(randomKey);
    }
  };

  // Derived State: Recent Changes (Sorted by lastUpdated desc)
  const recentChanges = useMemo(() => {
    return Object.keys(docs)
      .map(key => ({ title: key, ...docs[key] }))
      .sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0))
      .slice(0, 10);
  }, [docs]);

  // Derived State: Search Results
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return Object.keys(docs).filter(title => {
      const doc = docs[title];
      return title.includes(searchTerm) || (doc.content && doc.content.includes(searchTerm));
    });
  }, [docs, searchTerm]);

  return (
    <div className="min-h-screen bg-[#f0f0f0] font-sans text-[#373a3c]">
      {/* Navbar */}
      <Navbar 
        onSearch={goToSearch} 
        onHome={goToMain} 
        onRandom={goToRandom} 
        user={user}
      />

      <div className="max-w-6xl mx-auto p-4 mt-4 mb-20">
        {loading ? (
          <div className="text-center py-20 text-gray-500">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-[#7777AA] border-t-transparent rounded-full mb-4"></div>
            <p>데이터베이스 연결 및 문서 동기화 중...</p>
            {errorMsg && <p className="text-red-500 mt-2 text-sm">{errorMsg}</p>}
          </div>
        ) : (
          <>
            {view === 'main' && (
              <MainPage 
                recentChanges={recentChanges} 
                onDocClick={goToDoc} 
                onSearch={goToSearch}
              />
            )}
            
            {view === 'doc' && currentDocTitle && (
              <DocViewer 
                title={currentDocTitle} 
                initialData={docs[currentDocTitle]} 
                user={user}
                onLinkClick={goToDoc}
              />
            )}
            
            {view === 'search' && (
              <SearchResults 
                term={searchTerm} 
                results={searchResults} 
                onDocClick={goToDoc} 
                docs={docs}
              />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t py-6 text-center text-xs text-gray-500">
        <p>
          Powered by <strong>HyobinWiki v2.1 (Fixed)</strong><br />
          이 위키의 데이터는 안전하게 클라우드에 저장됩니다.
        </p>
      </footer>
    </div>
  );
}

// --- Components ---

function Navbar({ onSearch, onHome, onRandom, user }) {
  const [input, setInput] = useState('');

  const handleSearch = () => {
    if (input.trim()) onSearch(input);
  };

  return (
    <nav className="bg-[#7777AA] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onHome} className="text-xl font-bold flex items-center gap-2 hover:opacity-90">
            <Book size={24} /> <span>효빈위키</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <input 
              type="text" 
              placeholder="여기에서 검색..." 
              className="pl-4 pr-10 py-1.5 rounded-full text-black text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="absolute right-3 top-2 text-gray-500 hover:text-[#7777AA]">
              <Search size={16} />
            </button>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <button onClick={onRandom} className="flex items-center gap-1 hover:underline opacity-90">
              <RotateCcw size={14} /> <span className="hidden sm:inline">랜덤</span>
            </button>
            <div className="flex items-center gap-1 opacity-90">
              <User size={14} /> 
              <span className="hidden sm:inline font-medium">
                {user ? (user.isAnonymous ? '익명 사용자' : '효빈') : '로그인 중...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function MainPage({ recentChanges, onDocClick, onSearch }) {
  const [input, setInput] = useState('');
  
  return (
    <div className="bg-white border border-[#ccc] rounded-lg shadow-sm min-h-[80vh] p-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-[#7777AA] to-[#a0a0dd] text-white p-8 rounded-lg mb-8 text-center shadow-md">
        <h1 className="text-3xl font-bold mb-2">효빈위키에 오신 것을 환영합니다!</h1>
        <p className="text-lg opacity-90 mb-6">여러분이 만들어가는 지식의 보고입니다。</p>
        
        <div className="max-w-lg mx-auto relative text-gray-800">
          <input 
            type="text" 
            placeholder="문서 제목을 입력하세요..." 
            className="w-full p-4 pl-6 rounded-full text-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300/50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && input.trim() && onSearch(input)}
          />
          <button 
            onClick={() => input.trim() && onSearch(input)}
            className="absolute right-4 top-4 text-gray-400 hover:text-[#7777AA]"
          >
            <Search size={24} />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Featured Article */}
        <div className="border border-[#ddd] rounded-sm">
          <div className="bg-[#7777AA] text-white px-4 py-2 font-bold flex items-center gap-2">
            <Star size={16} /> 오늘의 알찬 문서
          </div>
          <div className="p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => onDocClick('효빈광역시')}>
            <h3 className="font-bold text-lg mb-2 text-[#0645ad]">효빈광역시</h3>
            <div className="flex gap-2">
                <div className="w-20 h-20 bg-gray-200 flex items-center justify-center text-2xl overflow-hidden rounded">
                   <img src={IMAGE_MAP['효빈광역시']} alt="썸네일" className="w-full h-full object-cover" />
                </div>
                <p className="text-sm text-gray-600 line-clamp-3 flex-1">
                   효빈광역시(孝彬廣域市)는 대한민국 남부권에 위치한 가상의 광역시이다. 인구 296만 명의 거대 도시로, 도시의 이름은 설립자이자 현 시장인 박효빈의 이름에서 유래하였다...
                </p>
            </div>
          </div>
        </div>

        {/* Recent Changes */}
        <div className="border border-[#ddd] rounded-sm">
          <div className="bg-[#7777AA] text-white px-4 py-2 font-bold flex items-center gap-2">
            <PenTool size={16} /> 최근 변경된 문서
          </div>
          <div className="p-4 bg-white">
            <ul className="space-y-2 text-sm">
              {recentChanges.length === 0 && <li className="text-gray-500">변경 내역이 없습니다.</li>}
              {recentChanges.map((doc) => (
                <li key={doc.title} className="flex justify-between items-center border-b border-dashed pb-1 last:border-0">
                  <span 
                    onClick={() => onDocClick(doc.title)} 
                    className="text-[#0645ad] cursor-pointer hover:underline font-medium"
                  >
                    {doc.title}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(doc.lastUpdated).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


function DiscussionBoard({ discuss, onAdd }) {
    const [topic, setTopic] = useState('');
    const [content, setContent] = useState('');
    const [modal, setModal] = useState({ visible: false, message: '' });

    const handleAdd = () => {
        if (!topic.trim() || !content.trim()) {
            setModal({ visible: true, message: '주제와 내용을 모두 입력해야 합니다.' });
            return;
        }
        onAdd(topic.trim(), content.trim());
        setTopic('');
        setContent('');
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">토론 게시판</h2>
            <div className="border border-[#7777AA] p-4 mb-6 rounded-md bg-[#f9f9ff]">
                <h3 className="font-bold mb-3 text-[#7777AA] flex items-center gap-2"><MessageSquare size={16}/> 새 토론 시작</h3>
                <input 
                    type="text" 
                    placeholder="토론 주제"
                    className="w-full p-2 border rounded mb-2"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                />
                <textarea 
                    placeholder="토론 내용"
                    rows="3"
                    className="w-full p-2 border rounded mb-3 resize-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                ></textarea>
                <button 
                    onClick={handleAdd}
                    className="bg-[#0645ad] text-white px-4 py-1.5 rounded text-sm hover:bg-blue-800"
                >
                    토론 등록
                </button>
            </div>

            <ul className="space-y-4">
                {discuss.length === 0 && <li className="text-gray-500">아직 토론이 없습니다.</li>}
                {discuss.slice().reverse().map((d, i) => ( // Show newest first
                    <li key={i} className="border p-4 rounded bg-gray-50 shadow-sm">
                        <div className="text-lg font-bold text-[#373a3c] mb-1">{d.topic}</div>
                        <div className="text-gray-700 text-sm mb-2 whitespace-pre-wrap">{d.content}</div>
                        <div className="text-xs text-gray-500 flex justify-between">
                            <span>{d.user}</span>
                            <span>{new Date(d.time).toLocaleString()}</span>
                        </div>
                    </li>
                ))}
            </ul>
            <CustomModal 
                visible={modal.visible}
                type="alert"
                message={modal.message}
                onConfirm={() => setModal({ visible: false, message: '' })}
            />
        </div>
    );
}


function DocViewer({ title, initialData, user, onLinkClick }) {
  const [tab, setTab] = useState('read'); // read, edit, history, discuss
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [docExists, setDocExists] = useState(false);
  const [docData, setDocData] = useState({ history: [], discuss: [] });
  const textareaRef = useRef(null);

  // --- Modal State (Replaces alert/prompt) ---
  const [modal, setModal] = useState({ 
    visible: false, 
    type: 'alert', // 'alert' or 'prompt'
    message: '', 
    title: '',
    onConfirm: () => setModal(m => ({...m, visible: false})), 
    defaultValue: ''
  });
  // ------------------------------------------

  // Reset state when title changes
  useEffect(() => {
    setTab('read');
    if (initialData) {
      setDocExists(true);
      setContent(initialData.content || '');
      setDocData(initialData);
    } else {
      setDocExists(false);
      setContent('');
      setDocData({ history: [], discuss: [] });
    }
  }, [title, initialData]);

  const handleSave = async () => {
    if (!content.trim()) {
        setModal({ 
            visible: true, 
            type: 'alert', 
            message: "문서 내용이 비어있습니다. 내용을 입력해주세요.",
            title: "저장 실패"
        });
        return;
    }
    
    const newHistoryItem = {
      rev: (docData.history?.length || 0) + 1,
      user: user?.isAnonymous ? '익명 사용자' : '효빈',
      time: new Date().toISOString(),
      summary: summary || '문서 수정'
    };

    const newData = {
      content: content,
      history: [newHistoryItem, ...(docData.history || [])],
      discuss: docData.discuss || [],
      lastUpdated: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wiki_docs', title), newData, { merge: true });
      setModal({ visible: true, type: 'alert', message: `문서 '${title}'이 성공적으로 저장되었습니다.`, title: "저장 완료" });
      setTab('read');
      setSummary('');
    } catch (e) {
      console.error(e);
      setModal({ visible: true, type: 'alert', message: "저장 중 오류가 발생했습니다. 콘솔을 확인해주세요.", title: "저장 오류" });
    }
  };

  const handleDiscussionAdd = async (topic, msg) => {
      const newDiscussItem = {
        topic,
        content: msg,
        user: user?.isAnonymous ? '익명 사용자' : '효빈',
        time: new Date().toISOString()
      };
      
      const updatedDiscuss = [...(docData.discuss || []), newDiscussItem];
      
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wiki_docs', title), {
          discuss: updatedDiscuss
        });
        // Local update will happen via listener
      } catch(e) {
        console.error(e);
        setModal({ visible: true, type: 'alert', message: "토론 저장 중 오류가 발생했습니다. 콘솔을 확인해주세요.", title: "토론 오류" });
      }
  };

  // Editor Helper Functions (using useCallback to prevent unnecessary re-renders)
  const insertText = useCallback((before, after = '') => {
    const el = textareaRef.current;
    if (!el) return;
    
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);
    
    const newText = text.substring(0, start) + before + selected + after + text.substring(end);
    setContent(newText);
    
    // Restore focus and cursor
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  }, []);

  const handleInsertImage = () => {
    // Show prompt modal for URL
    setModal({
        visible: true,
        type: 'prompt',
        message: '이미지 주소(URL)를 입력하세요:',
        title: '이미지 추가',
        defaultValue: 'https://',
        onConfirm: (url) => {
            setModal(m => ({...m, visible: false})); // Close current modal
            if (!url) return;

            // Show prompt modal for Caption
            setModal({
                visible: true,
                type: 'prompt',
                message: '이미지 설명(캡션)을 입력하세요:',
                title: '캡션 추가',
                defaultValue: "이미지 설명",
                onConfirm: (caption) => {
                    setModal(m => ({...m, visible: false}));
                    const finalCaption = caption || "이미지 설명";
                    const imageTag = `
<figure class="wiki-figure" style="text-align:center; margin: 20px 0; border:1px solid #ddd; padding:5px; background:#f9f9f9; display:inline-block; max-width:100%;">
  <img src="${url}" alt="${finalCaption}" style="max-width:100%; height:auto; display:block;" />
  <figcaption style="text-align:center; color:#555; font-size:0.9em; padding-top:5px;">${finalCaption}</figcaption>
</figure>`;
                    insertText(imageTag);
                },
            });
        },
    });
  };

  // Editor Toolbar Component
  const EditorToolbar = useMemo(() => (
    <div className="flex gap-1 mb-2 border p-1 rounded bg-gray-50 flex-wrap">
      <button onClick={() => insertText("'''", "'''")} className="p-2 hover:bg-gray-200 rounded" title="굵게"><Bold size={16}/></button>
      <button onClick={() => insertText("''", "''")} className="p-2 hover:bg-gray-200 rounded" title="기울임"><Italic size={16}/></button>
      <div className="w-px bg-gray-300 mx-1 h-6 self-center"></div>
      <button onClick={() => insertText("<h2 class='wiki-h2'>", "</h2>")} className="p-2 hover:bg-gray-200 rounded font-bold text-sm" title="문단 제목">H2</button>
      <button onClick={() => insertText("<h3 class='wiki-h3'>", "</h3>")} className="p-2 hover:bg-gray-200 rounded font-bold text-xs" title="소문단 제목">H3</button>
      <div className="w-px bg-gray-300 mx-1 h-6 self-center"></div>
      <button onClick={() => insertText("<ul class='list-disc ml-6'>\n  <li>", "</li>\n</ul>")} className="p-2 hover:bg-gray-200 rounded" title="목록"><List size={16}/></button>
      <button onClick={handleInsertImage} className="p-2 hover:bg-gray-200 rounded flex items-center gap-1" title="이미지 추가"><ImageIcon size={16}/> <span className="text-xs">이미지</span></button>
    </div>
  ), [insertText, handleInsertImage]);

  return (
    <div>
      {/* Custom Modal */}
      <CustomModal 
        visible={modal.visible}
        type={modal.type}
        message={modal.message}
        title={modal.title}
        onConfirm={modal.onConfirm}
        defaultValue={modal.defaultValue}
      />
      
      {/* Tabs */}
      <div className="flex ml-2">
        {[
          { id: 'read', label: '문서', icon: Book },
          { id: 'edit', label: '편집', icon: PenTool },
          { id: 'history', label: '역사', icon: History },
          { id: 'discuss', label: '토론', icon: MessageSquare }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 font-bold border-t border-l border-r rounded-t-md flex items-center gap-2 text-sm transition-colors ${
              tab === t.id 
                ? 'bg-white border-[#ccc] border-b-white text-black' 
                : 'bg-transparent border-transparent text-[#7777AA] hover:bg-gray-100'
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#ccc] min-h-[600px] p-8 rounded-b-lg rounded-tr-lg shadow-sm">
        {/* Title Header (Non-Hyobin광역시 docs) */}
        {title !== '효빈광역시' && (
              <div className="border-b pb-2 mb-6 flex justify-between items-end">
                <h1 className="text-4xl font-bold text-black">{title}</h1>
                <div className="flex gap-2 mb-1">
                   <button className="text-gray-400 hover:text-yellow-400 transition-colors"><Star size={20} /></button>
                </div>
              </div>
        )}

        {/* Content Views */}
        {tab === 'read' && (
          docExists ? (
            <>
              <WikiContentDisplay 
                htmlContent={docData.content}
                onLinkClick={onLinkClick}
              />
              <div className="mt-12 pt-4 border-t border-dashed text-xs text-gray-400">
                마지막 수정: {new Date(docData.lastUpdated).toLocaleString()}
              </div>
            </>
          ) : (
              <div className="text-center py-10">
               <p className="text-gray-500 mb-4">'{title}' 문서가 아직 존재하지 않습니다.</p>
               <button 
                 onClick={() => setTab('edit')}
                 className="bg-[#7777AA] text-white px-4 py-2 rounded hover:bg-[#555588]"
               >
                 새 문서 만들기
               </button>
              </div>
          )
        )}

        {tab === 'edit' && (
          <div>
            <div className="bg-yellow-50 border border-yellow-200 p-3 mb-4 rounded text-sm text-yellow-800 flex items-center gap-2">
              <User size={16} />
              <span>
                <strong>{user?.isAnonymous ? '익명 사용자' : '효빈'}</strong> (으)로 편집 중입니다. 
                IP 주소 대신 임시 ID가 기록됩니다.
              </span>
            </div>
            
            {EditorToolbar}

            <textarea
              ref={textareaRef}
              className="w-full h-96 border p-4 font-mono text-sm bg-gray-50 focus:outline-none focus:border-[#7777AA] mb-4 rounded"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="여기에 내용을 입력하세요. HTML 태그 사용이 가능합니다."
            />
            
            <div className="mb-4">
              <label className="block text-sm font-bold mb-1">편집 요약</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded"
                placeholder="수정 내용을 간략히 요약해주세요."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <button onClick={handleSave} className="bg-[#0645ad] text-white px-6 py-2 rounded font-bold hover:bg-blue-800 flex items-center gap-2">
                <Save size={16} /> 저장
              </button>
              <button onClick={() => setTab('read')} className="bg-gray-200 text-black px-6 py-2 rounded font-bold hover:bg-gray-300">
                취소
              </button>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div>
            <h2 className="text-xl font-bold mb-4">편집 역사</h2>
            <ul className="space-y-0">
              {docData.history?.map((h, i) => (
                <li key={i} className="border-b py-3 text-sm flex flex-col sm:flex-row sm:items-center gap-2">
                   <span className="font-mono text-[#0645ad] font-bold w-12">r{h.rev}</span>
                   <span className="text-gray-500 w-40">{new Date(h.time).toLocaleString()}</span>
                   <span className="font-bold w-32 truncate">{h.user}</span>
                   <span className="text-gray-600 flex-1">({h.summary})</span>
                </li>
              ))}
              {(!docData.history || docData.history.length === 0) && (
                <li className="text-gray-500">역사가 없습니다.</li>
              )}
            </ul>
          </div>
        )}

        {tab === 'discuss' && (
          <DiscussionBoard 
            discuss={docData.discuss || []} 
            onAdd={handleDiscussionAdd} 
          />
        )}
      </div>
      
      {/* CSS Injection for Wiki Styles within Content */}
      <style>{`
        .wiki-content h2.wiki-h2 { 
          font-size: 1.5rem; font-weight: 600; border-bottom: 1px solid #ccc; 
          padding: 10px 0; margin-top: 30px; margin-bottom: 15px; 
          scroll-margin-top: 80px; /* Sticky header offset */
        }
        .wiki-content h3.wiki-h3 { 
          font-size: 1.25rem; font-weight: 600; margin-top: 20px; margin-bottom: 10px; 
          padding-left: 10px; border-left: 5px solid #7777AA; 
          scroll-margin-top: 80px; 
        }
        /* Style for the new h4 in 3.2. timeline */
        .wiki-content h4.wiki-h3 { 
          font-size: 1.1rem; 
          font-weight: 600; 
          margin-top: 15px; 
          margin-bottom: 8px;
          padding-left: 0;
          border-left: none;
          scroll-margin-top: 80px; 
        }

        .wiki-content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1rem; }
        .wiki-content p { margin-bottom: 1rem; line-height: 1.6; }
        .wiki-content a { color: #0645ad; text-decoration: none; }
        .wiki-content a:hover { text-decoration: underline; }
        .wiki-content .infobox-container table th { background-color: #E8E8F3; color: #7777AA; }
        .wiki-table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        .wiki-table th, .wiki-table td { border: 1px solid #ddd; padding: 8px; }
        .wiki-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        .wiki-figure figcaption { margin-top: 5px; color: #666; font-size: 0.9em; }
        .wiki-header-table { margin: 0 0 10px 0 !important; } /* Ensure margin for proper flow */
        .toc-container-top { margin-top: 10px !important; } /* Ensure spacing after category box */
        
        /* Folding styles for infobox */
        .folding-header th {
            cursor: pointer;
            user-select: none;
            background-color: #555588 !important; /* Darker theme color for headers */
        }
        /* Hide the collapse icon which is no longer needed */
        .folding-indicator .open-icon, .folding-indicator .closed-icon {
            display: none !important;
        }
        .folding-content.hidden { display: none; }
        .folding-content table { 
          border-top: none !important; 
          margin: 0 !important;
        }
        /* Specific style for the history matrix table */
        .admin-history-table td {
            font-size: 0.85rem !important;
            line-height: 1.3;
        }
        .city-structure-table td {
            font-size: 0.85rem !important;
            line-height: 1.3;
        }
      `}</style>
    </div>
  );
}

function SearchResults({ term, results, onDocClick, docs }) {
    
    // Helper to get a snippet from the content
    const getSnippet = (content, term) => {
        if (!content) return "문서 내용 없음.";
        const plainText = content.replace(/<[^>]+>/g, ''); // Basic HTML strip
        const index = plainText.toLowerCase().indexOf(term.toLowerCase());
        
        if (index === -1) {
            return plainText.substring(0, 200) + '...';
        }

        const start = Math.max(0, index - 50);
        const end = Math.min(plainText.length, index + term.length + 150);
        const snippet = plainText.substring(start, end);
        
        const highlighted = snippet.replace(new RegExp(`(${term})`, 'gi'), '<strong style="background-color:#fff000; color:#333; padding:1px 0;">$1</strong>');
        
        return (start > 0 ? '...' : '') + highlighted + (end < plainText.length ? '...' : '');
    };

    return (
        <div className="bg-white border border-[#ccc] rounded-lg shadow-sm min-h-[80vh] p-8">
            <h1 className="text-3xl font-bold mb-6">검색 결과: "{term}"</h1>
            
            <p className="mb-4 text-gray-600">총 {results.length}개의 문서에서 결과를 찾았습니다。</p>

            <ul className="space-y-4">
                {results.map(title => (
                    <li key={title} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onDocClick(title)}>
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-xl font-bold text-[#0645ad] hover:underline">{title}</h2>
                            <span className="text-xs text-gray-400">
                                최종 수정: {new Date(docs[title].lastUpdated).toLocaleDateString()}
                            </span>
                        </div>
                        <p 
                            className="text-sm text-gray-700 leading-relaxed" 
                            dangerouslySetInnerHTML={{ __html: getSnippet(docs[title].content, term) }}
                        />
                    </li>
                ))}
            </ul>
            
            {results.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-lg">검색어와 일치하는 문서가 없습니다。</p>
                    <p className="text-sm mt-2">새 문서를 작성하거나 다른 검색어로 다시 시도해보세요。</p>
                </div>
            )}
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { MobileNav } from './components/MobileNav';
import { LocationModal } from './components/LocationModal';
import { AskFairBuyDrawer } from './components/AskFairBuyDrawer';

import { DashboardPage } from './pages/DashboardPage';
import { AnalyzePage } from './pages/AnalyzePage';
import { ProductAnalysisPage } from './pages/ProductAnalysisPage';
import { PriceIntelligencePage } from './pages/PriceIntelligencePage';
import { ReviewsPage } from './pages/ReviewsPage';
import { BuyDecisionPage } from './pages/BuyDecisionPage';
import { AlternativesPage } from './pages/AlternativesPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ActionZonePage } from './pages/ActionZonePage';
import { PujarisPage } from './pages/PujarisPage';
import { TransportPage } from './pages/TransportPage';
import { HotelsPage } from './pages/HotelsPage';
import { KumbhExplorePage } from './pages/KumbhExplorePage';
import { TravelPage } from './pages/TravelPage';
import { KumbhKitPage } from './pages/KumbhKitPage';
import { TripPlannerPage } from './pages/TripPlannerPage';
import { AskFairBuyPage } from './pages/AskFairBuyPage';
import { AdminPage } from './pages/AdminPage';
import { ReportModal } from './components/ReportModal';

import { ProductAnalysisFull, LocationInfo, AppSettings } from './types';
import { apiClient } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [location, setLocation] = useState<LocationInfo>({
    city: 'Nashik',
    state: 'Maharashtra',
    country: 'India',
    locality: 'College Road',
    source: 'default',
    formatted: 'Nashik, Maharashtra',
  });

  const [history, setHistory] = useState<ProductAnalysisFull[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<ProductAnalysisFull | undefined>(undefined);
  const [settings, setSettings] = useState<AppSettings>({
    demoMode: true,
    currency: '₹',
    defaultCity: 'Nashik',
    defaultState: 'Maharashtra',
    cacheFreshnessMinutes: 15,
    fairPriceThresholdPercent: 10,
    geminiApiKeyConfigured: false,
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalData, setReportModalData] = useState<{
    itemOrTrip?: string;
    quotedPrice?: number;
    fairPriceMax?: number;
    reportType?: 'product_overcharging' | 'rickshaw_meter_refusal' | 'mrp_violation' | 'false_warranty';
  }>({});
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const handleOpenReportModal = (
    itemOrTrip?: string,
    quotedPrice?: number,
    fairPriceMax?: number,
    reportType?: 'product_overcharging' | 'rickshaw_meter_refusal' | 'mrp_violation' | 'false_warranty'
  ) => {
    setReportModalData({
      itemOrTrip: itemOrTrip || 'Target Product / Trip',
      quotedPrice: quotedPrice || 1200,
      fairPriceMax: fairPriceMax || 1000,
      reportType: reportType || 'product_overcharging',
    });
    setIsReportModalOpen(true);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const histData = await apiClient.getHistory();
        setHistory(histData);
        if (histData.length > 0) {
          setActiveAnalysis(histData[0]);
        }
        const setts = await apiClient.getSettings();
        setSettings(setts);
      } catch (err) {
        console.warn('Backend connection pending, running local client mode');
      }
    }
    loadData();
  }, []);

  const handleStartAnalysis = async (payload: {
    productName?: string;
    brand?: string;
    model?: string;
    category?: string;
    quotedPrice: number;
    barcode?: string;
    imageBuffer?: string;
  }) => {
    setLoadingAnalysis(true);
    try {
      const result = await apiClient.analyzeProduct({
        ...payload,
        location,
      });
      setActiveAnalysis(result);
      setHistory((prev) => [result, ...prev.filter((item) => item.id !== result.id)]);
      setActiveTab('product-analysis');
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleQuickCheck = (productName: string, quotedPrice: number) => {
    handleStartAnalysis({ productName, quotedPrice });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
      {/* Sidebar for Desktop */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        location={location}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
      />

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          location={location}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          onOpenScan={() => setActiveTab('analyze')}
          onOpenChat={() => setIsChatDrawerOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {loadingAnalysis ? (
            <div className="flex flex-col items-center justify-center min-h-96 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 animate-spin flex items-center justify-center text-white font-bold">
                F
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Analyzing Market Signals & Web Reviews...</h3>
                <p className="text-xs text-slate-500">Checking current prices, web reviews, & location context in {location.formatted}</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardPage
                  location={location}
                  recentAnalyses={history}
                  onOpenScan={() => setActiveTab('analyze')}
                  onOpenManualEntry={() => setActiveTab('analyze')}
                  onSelectAnalysis={(analysis) => {
                    setActiveAnalysis(analysis);
                    setActiveTab('buy-decision');
                  }}
                  onQuickCheck={handleQuickCheck}
                  onOpenLocationModal={() => setIsLocationModalOpen(true)}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'analyze' && (
                <AnalyzePage
                  location={location}
                  onStartAnalysis={handleStartAnalysis}
                  onOpenLocationModal={() => setIsLocationModalOpen(true)}
                />
              )}

              {activeTab === 'ask-fairbuy' && (
                <AskFairBuyPage
                  location={location}
                  activeAnalysis={activeAnalysis}
                />
              )}

              {activeTab === 'kumbh-guide' && (
                <KumbhExplorePage location={location} />
              )}

              {activeTab === 'travel' && (
                <TravelPage location={location} />
              )}

              {activeTab === 'pujari' && (
                <PujarisPage location={location} />
              )}

              {activeTab === 'transport' && (
                <TransportPage location={location} />
              )}

              {activeTab === 'hotels' && (
                <HotelsPage location={location} />
              )}

              {activeTab === 'kumbh-kit' && (
                <KumbhKitPage />
              )}

              {activeTab === 'my-trips' && (
                <TripPlannerPage location={location} />
              )}

              {activeTab === 'admin' && (
                <AdminPage />
              )}

              {activeTab === 'action-zone' && (
                <ActionZonePage
                  location={location}
                  onOpenReportModal={() => handleOpenReportModal()}
                />
              )}

              {activeTab === 'product-analysis' && activeAnalysis && (
                <ProductAnalysisPage
                  analysis={activeAnalysis}
                  onConfirm={() => setActiveTab('buy-decision')}
                  onReject={() => setActiveTab('analyze')}
                />
              )}

              {activeTab === 'price-intelligence' && activeAnalysis && (
                <PriceIntelligencePage
                  analysis={activeAnalysis}
                  onOpenLocationModal={() => setIsLocationModalOpen(true)}
                />
              )}

              {activeTab === 'reviews' && activeAnalysis && (
                <ReviewsPage analysis={activeAnalysis} />
              )}

              {activeTab === 'buy-decision' && activeAnalysis && (
                <BuyDecisionPage
                  analysis={activeAnalysis}
                  onOpenLocationModal={() => setIsLocationModalOpen(true)}
                  onNavigateToAlternatives={() => setActiveTab('alternatives')}
                  onOpenReportModal={handleOpenReportModal}
                />
              )}

              {activeTab === 'alternatives' && (
                <AlternativesPage
                  analysis={activeAnalysis}
                  onSelectAlternative={(alt) => {
                    if (activeAnalysis) {
                      handleStartAnalysis({
                        productName: alt.name,
                        brand: alt.brand,
                        model: alt.model,
                        quotedPrice: alt.price,
                      });
                    }
                  }}
                />
              )}

              {activeTab === 'history' && (
                <HistoryPage
                  history={history}
                  onSelectAnalysis={(analysis) => {
                    setActiveAnalysis(analysis);
                    setActiveTab('buy-decision');
                  }}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsPage
                  settings={settings}
                  onSettingsUpdated={(newSettings) => setSettings(newSettings)}
                />
              )}
            </>
          )}
        </main>

        {/* Mobile Navigation */}
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={location}
        onLocationUpdated={(newLoc) => setLocation(newLoc)}
      />

      {/* Ask FairBuy Assistant Drawer */}
      <AskFairBuyDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        activeAnalysis={activeAnalysis}
      />

      {/* Consumer Action Zone Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        location={location}
        initialItemOrTrip={reportModalData.itemOrTrip}
        initialQuotedPrice={reportModalData.quotedPrice}
        initialFairPriceMax={reportModalData.fairPriceMax}
        initialReportType={reportModalData.reportType}
      />
    </div>
  );
}

export default App;

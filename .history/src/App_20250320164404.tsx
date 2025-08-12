import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ProductGrid from './components/ProductGrid';
import Cart from './components/Cart';
import SalesHistoryFirebase from './components/SalesHistoryFirebase';
import Receipt from './components/Receipt';
import PaymentModal from './components/PaymentModal';
import StockAlert from './components/StockAlert';
import SupplierOrders from './components/SupplierOrders';
import SupplierOrderModal from './components/SupplierOrderModal';
import PromotionsManager from './components/PromotionsManager';
import LoyaltyCardModal from './components/LoyaltyCardModal';
import StockManager from './components/StockManager';
import StockMovementModal from './components/StockMovementModal';
import StockHistoryModal from './components/StockHistoryModal';
import EmployeeManagerFirebase from './components/EmployeeManagerFirebase';
import EmployeeLogin from './components/EmployeeLogin';
import { logout } from './services/authService';
import { canAccessView } from './services/permissionService';
import { addSale, getSales as fetchSales } from './services/saleService';
import { getStockMovements, adjustStock } from './services/stockService';
import Reports from './components/Reports';
import SettingsFirebase from './components/SettingsFirebase';
import { Product, CartItem, Sale, Receipt as ReceiptType, SupplierOrder, Promotion, LoyaltyCard, Employee, StockMovement, StockAdjustment } from './types';

function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Charger les ventes et les mouvements de stock depuis Firebase au chargement
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les ventes
        const salesData = await fetchSales();
        setSales(salesData);
        
        // Les mouvements de stock sont maintenant chargés directement depuis Firebase
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };

    loadData();
  }, []);
  const [showReceipt, setShowReceipt] = useState<ReceiptType | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeView, setActiveView] = useState<'pos' | 'history' | 'orders' | 'promotions' | 'employees' | 'stock' | 'reports' | 'settings'>('pos');
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [showSupplierOrderModal, setShowSupplierOrderModal] = useState(false);
  const [showLoyaltyCardModal, setShowLoyaltyCardModal] = useState(false);
  const [showStockMovementModal, setShowStockMovementModal] = useState<Product | null>(null);
  const [showStockHistoryModal, setShowStockHistoryModal] = useState<Product | null>(null);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [selectedLoyaltyCard, setSelectedLoyaltyCard] = useState<LoyaltyCard | undefined>();
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'Coca-Cola 1.5L',
      price: 2.50,
      stock: 36,
      category: 'Boissons',
      image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400',
      lowStockThreshold: 15,
      vatRate: 21,
      supplier: 'Coca-Cola Company',
      orderQuantity: 24,
      promotion: {
        id: 'promo1',
        type: 'percentage',
        value: 20,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        description: 'Réduction de 20%'
      }
    },
    {
      id: '2',
      name: 'Red Bull 250ml',
      price: 1.95,
      stock: 48,
      category: 'Boissons',
      image: 'https://images.unsplash.com/photo-1551870573-6f5e93e660fd?w=400',
      lowStockThreshold: 20,
      vatRate: 21,
      supplier: 'Red Bull GmbH',
      orderQuantity: 48
    },
    {
      id: '3',
      name: 'Lay\'s Chips Nature 150g',
      price: 1.75,
      stock: 25,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1600952841320-db92ec4047ca?w=400',
      lowStockThreshold: 10,
      vatRate: 21,
      supplier: 'PepsiCo',
      orderQuantity: 30,
      promotion: {
        id: 'promo2',
        type: 'buyXgetY',
        value: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        description: 'Achetez-en 2, obtenez-en 1 gratuit',
        buyQuantity: 2,
        getFreeQuantity: 1
      }
    },
    {
      id: '5',
      name: 'Marlboro Rouge',
      price: 8.50,
      stock: 40,
      category: 'Cigarettes',
      image: 'https://images.unsplash.com/photo-1525268771113-32d9e9021a97?w=400',
      lowStockThreshold: 15,
      vatRate: 21,
      supplier: 'Philip Morris',
      orderQuantity: 30
    },
    {
      id: '6',
      name: 'Bière Jupiler 33cl',
      price: 1.20,
      stock: 72,
      category: 'Boissons',
      image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400',
      lowStockThreshold: 24,
      vatRate: 21,
      supplier: 'AB InBev',
      orderQuantity: 48,
      promotion: {
        id: 'promo3',
        type: 'fixed',
        value: 0.30,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        description: '0.30€ de réduction'
      }
    },
    {
      id: '7',
      name: 'Twix 50g',
      price: 0.85,
      stock: 45,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1534260164206-2a3a4a72891d?w=400',
      lowStockThreshold: 15,
      vatRate: 21,
      supplier: 'Mars Inc.',
      orderQuantity: 36
    },
    {
      id: '8',
      name: 'Eau Spa Reine 1.5L',
      price: 1.20,
      stock: 80,
      category: 'Boissons',
      image: 'https://images.unsplash.com/photo-1560847468-5eef330f455a?w=400',
      lowStockThreshold: 30,
      vatRate: 6,
      supplier: 'Spadel',
      orderQuantity: 48
    },
    {
      id: '10',
      name: 'Café Senseo Pods',
      price: 3.99,
      stock: 25,
      category: 'Épicerie',
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
      lowStockThreshold: 10,
      vatRate: 6,
      supplier: 'JDE Peet\'s',
      orderQuantity: 20
    },
    {
      id: '12',
      name: 'Haribo Dragibus',
      price: 1.99,
      stock: 40,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1534705867302-2a41394d2a3b?w=400',
      lowStockThreshold: 15,
      vatRate: 21,
      supplier: 'Haribo',
      orderQuantity: 24,
      promotion: {
        id: 'promo4',
        type: 'percentage',
        value: 15,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        description: 'Réduction de 15%'
      }
    }
  ]);

  const [loyaltyCards, setLoyaltyCards] = useState<LoyaltyCard[]>([
    {
      id: '1',
      number: 'LC20240001',
      customerName: 'Jean Dupont',
      email: 'jean.dupont@email.com',
      phone: '+32 470 12 34 56',
      points: 450,
      tier: 'gold',
      createdAt: new Date('2023-01-15'),
      lastUsed: new Date('2024-01-10')
    },
    {
      id: '2',
      number: 'LC20240002',
      customerName: 'Marie Lambert',
      email: 'marie.lambert@email.com',
      phone: '+32 475 98 76 54',
      points: 150,
      tier: 'silver',
      createdAt: new Date('2023-06-20'),
      lastUsed: new Date('2024-01-05')
    },
    {
      id: '3',
      number: 'LC20240003',
      customerName: 'Ahmed Ben Ali',
      email: 'ahmed.benali@email.com',
      phone: '+32 488 11 22 33',
      points: 750,
      tier: 'platinum',
      createdAt: new Date('2023-03-10'),
      lastUsed: new Date('2024-01-12')
    }
  ]);

  const employees: Employee[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@nightshop.be',
      role: 'admin',
      pin: '1234',
      active: true,
      createdAt: new Date('2023-01-01'),
      permissions: [
        { id: 'pos', name: 'POS', description: 'Accès à la caisse', category: 'pos', level: 'write' },
        { id: 'inventory', name: 'Inventaire', description: 'Gestion du stock', category: 'inventory', level: 'write' },
        { id: 'reports', name: 'Rapports', description: 'Accès aux rapports', category: 'reports', level: 'read' }
      ]
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Smith',
      email: 'sarah@nightshop.be',
      role: 'manager',
      pin: '5678',
      active: true,
      createdAt: new Date('2023-03-15'),
      permissions: [
        { id: 'pos', name: 'POS', description: 'Accès à la caisse', category: 'pos', level: 'write' },
        { id: 'inventory', name: 'Inventaire', description: 'Gestion du stock', category: 'inventory', level: 'write' }
      ]
    },
    {
      id: '3',
      firstName: 'Pierre',
      lastName: 'Dubois',
      email: 'pierre@nightshop.be',
      role: 'cashier',
      pin: '9012',
      active: true,
      createdAt: new Date('2023-06-01'),
      permissions: [
        { id: 'pos', name: 'POS', description: 'Accès à la caisse', category: 'pos', level: 'write' }
      ]
    }
  ];

  const handleAddProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
    };

    setProducts(prev => [...prev, newProduct]);

    if (newProduct.stock > 0) {
      const movement: StockMovement = {
        id: crypto.randomUUID(),
        productId: newProduct.id,
        type: 'adjustment',
        quantity: newProduct.stock,
        previousStock: 0,
        newStock: newProduct.stock,
        timestamp: new Date(),
        reason: 'Stock initial',
        employeeId: currentEmployee?.id || '',
      };

      // Le mouvement est déjà enregistré dans Firebase
    }
  };

  const handleStockAdjustment = async (adjustment: StockAdjustment) => {
    // Trouver le produit concerné
    const product = products.find(p => p.id === adjustment.productId);
    if (!product) return;
    
    // Compléter l'ajustement avec l'ID de l'employé
    const completeAdjustment = {
      ...adjustment,
      employeeId: currentEmployee?.id || ''
    };
    
    try {
      // Utiliser le service pour ajuster le stock et enregistrer le mouvement dans Firebase
      const movement = await adjustStock(completeAdjustment, product.stock);
      
      if (movement) {
        // Le mouvement est déjà enregistré dans Firebase
        
        // Mettre à jour l'état local des produits
        setProducts(prev => 
          prev.map(p => {
            if (p.id === adjustment.productId) {
              return { ...p, stock: movement.newStock };
            }
            return p;
          })
        );
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajustement du stock:', error);
      alert('Erreur lors de l\'ajustement du stock. Veuillez réessayer.');
    }
  };

  const handleProductSelect = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          return prevItems;
        }
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevItems, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId)
    );
  };

  const handleCheckout = () => {
    setShowPaymentModal(true);
  };

  const calculatePromotionalPrice = (product: Product, quantity: number): number => {
    if (!product.promotion || !isPromotionActive(product.promotion)) {
      return product.price * quantity;
    }

    switch (product.promotion.type) {
      case 'percentage':
        return product.price * quantity * (1 - product.promotion.value / 100);
      case 'fixed':
        return Math.max(0, (product.price - product.promotion.value) * quantity);
      case 'buyXgetY':
        if (product.promotion.buyQuantity && product.promotion.getFreeQuantity) {
          const sets = Math.floor(quantity / (product.promotion.buyQuantity + product.promotion.getFreeQuantity));
          const remainder = quantity % (product.promotion.buyQuantity + product.promotion.getFreeQuantity);
          return (sets * product.promotion.buyQuantity + Math.min(remainder, product.promotion.buyQuantity)) * product.price;
        }
        return product.price * quantity;
      default:
        return product.price * quantity;
    }
  };

  const isPromotionActive = (promotion: Promotion): boolean => {
    const now = new Date();
    return now >= new Date(promotion.startDate) && now <= new Date(promotion.endDate);
  };

  const handleCreateOrder = () => {
    setShowSupplierOrderModal(true);
  };

  const handleOrderSubmit = (order: SupplierOrder) => {
    setSupplierOrders(prev => [...prev, order]);
  };

  const handleReceiveOrder = async (orderId: string) => {
    // Mettre à jour le statut de la commande
    setSupplierOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'delivered' } 
          : order
      )
    );

    const order = supplierOrders.find(o => o.id === orderId);
    if (order) {
      const updatedProducts = [...products];
      const stockMovementPromises = [];
      
      // Pour chaque produit commandé, créer un mouvement de stock
      for (const orderedProduct of order.products) {
        const productIndex = updatedProducts.findIndex(p => p.id === orderedProduct.product.id);
        if (productIndex !== -1) {
          const product = updatedProducts[productIndex];
          const newStock = product.stock + orderedProduct.quantity;
          
          // Ajouter le mouvement à Firebase
          const promise = adjustStock({
            productId: product.id,
            quantity: orderedProduct.quantity,
            type: 'adjustment',
            reason: 'Réception commande #' + orderId,
            employeeId: currentEmployee?.id || '',
            reference: orderId
          }, product.stock);
          
          stockMovementPromises.push(promise);
          
          // Mettre à jour le produit dans notre tableau temporaire
          updatedProducts[productIndex] = {
            ...product,
            stock: newStock
          };
        }
      }
      
      try {
        // Attendre que tous les mouvements de stock soient enregistrés
        const movements = await Promise.all(stockMovementPromises);
        
        // Filtrer les mouvements null
        const validMovements = movements.filter(m => m !== null) as StockMovement[];
        
        // Les mouvements sont déjà enregistrés dans Firebase
        
        // Mettre à jour l'état local des produits
        setProducts(updatedProducts);
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement des mouvements de stock:', error);
        alert('La commande a été marquée comme reçue, mais une erreur est survenue lors de la mise à jour du stock.');
      }
    }
  };

  const handleUpdatePromotion = (productId: string, promotion: Promotion | undefined) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === productId
          ? { ...product, promotion }
          : product
      )
    );
  };

  const handleUpdateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === productId
          ? { ...product, ...updates }
          : product
      )
    );
  };

  const handleCreateLoyaltyCard = (cardData: Omit<LoyaltyCard, 'id' | 'points' | 'tier' | 'createdAt'>) => {
    const newCard: LoyaltyCard = {
      ...cardData,
      id: crypto.randomUUID(),
      points: 0,
      tier: 'bronze',
      createdAt: new Date(),
    };

    setLoyaltyCards(prev => [...prev, newCard]);
    setSelectedLoyaltyCard(newCard);
    setShowLoyaltyCardModal(false);
  };

  const getLoyaltyDiscount = (card?: LoyaltyCard): number => {
    if (!card) return 0;
    // Définition des tiers de fidélité
    const loyaltyTiers = [
      { name: 'bronze', discountPercentage: 5 },
      { name: 'silver', discountPercentage: 10 },
      { name: 'gold', discountPercentage: 15 },
      { name: 'platinum', discountPercentage: 20 }
    ];
    const tier = loyaltyTiers.find((t: { name: string, discountPercentage: number }) => t.name === card.tier);
    return tier ? tier.discountPercentage / 100 : 0;
  };

  const handlePaymentComplete = async (method: 'cash' | 'card', amountReceived: number) => {
    const total = cartItems.reduce(
      (sum, item) => sum + calculatePromotionalPrice(item.product, item.quantity),
      0
    );

    const finalTotal = total * (1 - getLoyaltyDiscount(selectedLoyaltyCard));
    const change = amountReceived - finalTotal;
    const receiptNumber = generateReceiptNumber();

    const sale: Omit<Sale, 'id'> = {
      items: cartItems,
      subtotal: total,
      total: finalTotal,
      timestamp: new Date(),
      paymentMethod: method,
      receiptNumber: receiptNumber,
      amountReceived,
      change: change,
      employeeId: currentEmployee?.id || '',
      vatAmounts: {
        vat6: 0,
        vat12: 0,
        vat21: 0
      }
    };

    try {
      // Sauvegarder la vente dans Firebase
      const savedSale = await addSale(sale);
      
      if (savedSale) {
        const receipt: ReceiptType = {
          sale: savedSale,
          businessName: 'Night Shop Express',
          address: 'Rue de la Station 123, 1000 Bruxelles',
          phone: '02 123 45 67',
          email: 'contact@nightshop.be',
          vatNumber: 'BE 0123.456.789'
        };

        // Mettre à jour l'état local avec la vente sauvegardée
        setSales((prev) => [savedSale, ...prev]);
        setShowReceipt(receipt);
        setShowPaymentModal(false);
        setCartItems([]);
        setSelectedLoyaltyCard(undefined);

        // Mettre à jour le stock et enregistrer les mouvements dans Firebase
        const updatedProducts = [...products];
        const stockMovementPromises = [];
        
        // Pour chaque article vendu, créer un mouvement de stock
        for (const item of cartItems) {
          const productIndex = updatedProducts.findIndex(p => p.id === item.product.id);
          if (productIndex !== -1) {
            const product = updatedProducts[productIndex];
            const newStock = product.stock - item.quantity;
            
            // Ajouter le mouvement à Firebase et à l'état local
            const promise = adjustStock({
              productId: product.id,
              quantity: -item.quantity,
              type: 'adjustment',
              reason: 'Vente - ' + receiptNumber,
              employeeId: currentEmployee?.id || '',
              reference: receiptNumber
            }, product.stock);
            
            stockMovementPromises.push(promise);
            
            // Mettre à jour le produit dans notre tableau temporaire
            updatedProducts[productIndex] = {
              ...product,
              stock: newStock
            };
          }
        }
        
        // Attendre que tous les mouvements de stock soient enregistrés
        Promise.all(stockMovementPromises)
          .then(movements => {
            // Filtrer les mouvements null
            const validMovements = movements.filter(m => m !== null) as StockMovement[];
            
            // Les mouvements sont déjà enregistrés dans Firebase
            
            // Mettre à jour l'état local des produits
            setProducts(updatedProducts);
          })
          .catch(error => {
            console.error('Erreur lors de l\'enregistrement des mouvements de stock:', error);
          });
      } else {
        console.error('Erreur lors de la sauvegarde de la vente dans Firebase');
        alert('Erreur lors de la sauvegarde de la vente. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la vente:', error);
      alert('Erreur lors de la sauvegarde de la vente. Veuillez réessayer.');
    }
  };

  const generateReceiptNumber = () => {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BE${timestamp}${random}`;
  };

  const hasPermission = (view: string) => {
    return canAccessView(currentEmployee, view);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentEmployee(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (!currentEmployee) {
    return (
      <EmployeeLogin
        onLogin={setCurrentEmployee}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        currentEmployee={currentEmployee}
        onLogout={handleLogout}
        hasPermission={hasPermission}
      />
      
      {activeView === 'pos' ? (
        <>
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">
                Night Shop Express - Caisse
              </h1>
              <ProductGrid 
                products={products}
                onProductSelect={handleProductSelect} 
              />
            </div>
          </div>
          <div className="w-96 border-l bg-white">
            <Cart
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onCheckout={handleCheckout}
              calculatePromotionalPrice={calculatePromotionalPrice}
            />
          </div>
        </>
      ) : activeView === 'history' ? (
        <div className="flex-1 p-6 overflow-auto">
          <SalesHistoryFirebase 
            onViewReceipt={(sale) => {
              // Créer un reçu à partir de la vente
              const receipt: ReceiptType = {
                sale: sale,
                businessName: "Night Shop",
                address: "123 Rue de Bruxelles, 1000 Bruxelles",
                phone: "+32 2 123 45 67",
                email: "contact@nightshop.be",
                vatNumber: "BE0123456789"
              };
              setShowReceipt(receipt);
            }} 
          />
        </div>
      ) : activeView === 'orders' ? (
        <SupplierOrders
          orders={supplierOrders}
          onCreateOrder={handleCreateOrder}
          onReceiveOrder={handleReceiveOrder}
        />
      ) : activeView === 'promotions' ? (
        <PromotionsManager
          products={products}
          onUpdateProduct={handleUpdatePromotion}
        />
      ) : activeView === 'stock' ? (
        <StockManager
          products={products}
          onUpdateProduct={handleUpdateProduct}
          onShowMovementModal={setShowStockMovementModal}
          onShowHistoryModal={setShowStockHistoryModal}
          onAddProduct={handleAddProduct}
        />
      ) : activeView === 'employees' ? (
        <div className="w-full h-full bg-gray-100">
          <EmployeeManagerFirebase />
        </div>
      ) : activeView === 'reports' ? (
        <Reports
          sales={sales}
          products={products}
          employees={employees}
        />
      ) : activeView === 'settings' ? (
        <SettingsFirebase
          onSave={(settings) => {
            console.log('Settings saved:', settings);
            // Implement settings save logic
          }}
        />
      ) : null}

      {showPaymentModal && (
        <PaymentModal
          total={cartItems.reduce(
            (sum, item) => sum + calculatePromotionalPrice(item.product, item.quantity),
            0
          )}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
          onShowLoyaltyCard={() => setShowLoyaltyCardModal(true)}
          selectedLoyaltyCard={selectedLoyaltyCard}
          loyaltyDiscount={getLoyaltyDiscount(selectedLoyaltyCard)}
        />
      )}

      {showReceipt && (
        <Receipt
          receipt={showReceipt}
          onClose={() => setShowReceipt(null)}
        />
      )}

      {showStockAlert && (
        <StockAlert
          products={products}
          onClose={() => setShowStockAlert(false)}
        />
      )}

      {showSupplierOrderModal && (
        <SupplierOrderModal
          products={products}
          onClose={() => setShowSupplierOrderModal(false)}
          onOrderSubmit={handleOrderSubmit}
        />
      )}

      {showLoyaltyCardModal && (
        <LoyaltyCardModal
          onClose={() => setShowLoyaltyCardModal(false)}
          onSelectCard={(card) => {
            setSelectedLoyaltyCard(card);
            setShowLoyaltyCardModal(false);
          }}
          onCreateCard={handleCreateLoyaltyCard}
          existingCards={loyaltyCards}
        />
      )}

      {showStockMovementModal && (
        <StockMovementModal
          product={showStockMovementModal}
          onClose={() => setShowStockMovementModal(null)}
          onSubmit={handleStockAdjustment}
        />
      )}

      {showStockHistoryModal && (
        <StockHistoryModal
          product={showStockHistoryModal}
          onClose={() => setShowStockHistoryModal(null)}
        />
      )}
    </div>
  );
}

export default App;
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
import { MapPin, Star, UtensilsCrossed, Navigation, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { catalogService, resolveImageSource } from '../services/catalogService';

interface HomeCookMapItem {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  distanceKm: number;
  cuisinesOrDish: string;
  priceText: string;
  isVeg: boolean;
  image: any;
  verified: boolean;
  lat: number;
  lng: number;
  route: string;
}

export default function NearbyChefsMap() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'veg' | 'non_veg' | 'top_rated'>('all');
  const [homeCookItems, setHomeCookItems] = useState<HomeCookMapItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const carouselRef = useRef<ScrollView>(null);
  const iframeRef = useRef<any>(null);

  useEffect(() => {
    catalogService.getLiveHomeKitchens().then((items) => {
      setHomeCookItems(items as any);
      if (items.length > 0) {
        setSelectedId(items[0].id);
      }
    });
  }, []);

  // Filter items
  const filteredItems = homeCookItems.filter(item => {
    if (filter === 'veg') return item.isVeg;
    if (filter === 'non_veg') return !item.isVeg;
    if (filter === 'top_rated') return item.rating >= 4.85;
    return true;
  });

  // Listen to message from Leaflet iframe when user clicks a marker
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'MARKER_CLICK') {
          const clickedId = event.data.id;
          setSelectedId(clickedId);
          const index = filteredItems.findIndex(i => i.id === clickedId);
          if (index !== -1 && carouselRef.current) {
            carouselRef.current.scrollTo({ x: index * 285, animated: true });
          }
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [filteredItems]);

  const handleSelectCard = (item: HomeCookMapItem, index: number) => {
    setSelectedId(item.id);
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ x: index * 285, animated: true });
    }
    if (Platform.OS === 'web' && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'FLY_TO',
        lat: item.lat,
        lng: item.lng,
        id: item.id
      }, '*');
    }
  };

  const handleRecenter = () => {
    if (Platform.OS === 'web' && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'RECENTER',
        lat: 12.8797,
        lng: 77.6245
      }, '*');
    }
  };

  // Generate HTML for Leaflet OpenStreetMap with clean pins (No cartoon emojis)
  const leafletHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background-color: #f8fafc; }
    .cook-pin {
      background: #0F172A;
      color: #FFFFFF;
      border-radius: 8px;
      padding: 5px 10px;
      font-weight: 700;
      font-size: 11px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 4px 10px rgba(15,23,42,0.25);
      border: 1.5px solid #FFFFFF;
      display: flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      cursor: pointer;
      transform: translate(-50%, -50%);
      transition: all 0.2s ease;
    }
    .cook-pin.active {
      background: #5F259F;
      transform: translate(-50%, -50%) scale(1.12);
      box-shadow: 0 6px 16px rgba(95,37,159,0.35);
      z-index: 9999 !important;
    }
    .star-tag {
      color: #F59E0B;
      font-size: 11px;
    }
    .user-pulse-marker {
      width: 14px;
      height: 14px;
      background: #3B82F6;
      border-radius: 50%;
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25);
    }
    .leaflet-popup-content-wrapper {
      border-radius: 10px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [12.8797, 77.6245],
      zoom: 14,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // User location marker
    var userIcon = L.divIcon({
      className: '',
      html: '<div class="user-pulse-marker"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    L.marker([12.8797, 77.6245], { icon: userIcon }).addTo(map)
      .bindPopup("<b>You are here</b><br>Begur, Bengaluru");

    var markersMap = {};
    var items = ${JSON.stringify(homeCookItems)};

    items.forEach(function(item) {
      var pinHtml = '<div class="cook-pin" id="pin-' + item.id + '">' +
        '<span class="star-tag">★ ' + item.rating + '</span> ' +
        '<span>' + item.name + '</span>' +
        '</div>';

      var customIcon = L.divIcon({
        className: '',
        html: pinHtml,
        iconSize: [120, 28],
        iconAnchor: [60, 14]
      });

      var marker = L.marker([item.lat, item.lng], { icon: customIcon }).addTo(map);
      marker.on('click', function() {
        setActivePin(item.id);
        window.parent.postMessage({ type: 'MARKER_CLICK', id: item.id }, '*');
      });

      markersMap[item.id] = { marker: marker, lat: item.lat, lng: item.lng };
    });

    function setActivePin(id) {
      document.querySelectorAll('.cook-pin').forEach(function(el) {
        el.classList.remove('active');
      });
      var activeEl = document.getElementById('pin-' + id);
      if (activeEl) {
        activeEl.classList.add('active');
      }
    }

    setActivePin('${selectedId}');

    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'FLY_TO') {
        map.flyTo([e.data.lat, e.data.lng], 15, { duration: 0.8 });
        setActivePin(e.data.id);
      } else if (e.data && e.data.type === 'RECENTER') {
        map.flyTo([e.data.lat, e.data.lng], 14, { duration: 0.6 });
      }
    });
  </script>
</body>
</html>
  `;

  return (
    <View style={styles.container}>
      
      {/* MAP BACKGROUND */}
      <View style={styles.mapFrame}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            srcDoc={leafletHtml}
            style={{ width: '100%', height: '100%', border: 'none' } as any}
            title="Nearby Home Cooks Map"
          />
        ) : (
          <View style={styles.nativeFallback}>
            <MapPin size={40} color="#0F172A" />
            <Text style={styles.nativeFallbackText}>Nearby Home Kitchens</Text>
            <Text style={styles.nativeFallbackSub}>Begur, Bengaluru • Showing {filteredItems.length} verified home cooks</Text>
          </View>
        )}
      </View>

      {/* FLOATING TOP FILTER BAR */}
      <View style={styles.filterFloatingBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
              All Kitchens ({homeCookItems.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, filter === 'veg' && styles.filterChipActive]}
            onPress={() => setFilter('veg')}
            activeOpacity={0.7}
          >
            <View style={styles.vegIndicatorDot} />
            <Text style={[styles.filterChipText, filter === 'veg' && styles.filterChipTextActive]}>
              Pure Veg
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, filter === 'non_veg' && styles.filterChipActive]}
            onPress={() => setFilter('non_veg')}
            activeOpacity={0.7}
          >
            <View style={styles.nonVegIndicatorDot} />
            <Text style={[styles.filterChipText, filter === 'non_veg' && styles.filterChipTextActive]}>
              Non-Veg Specials
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, filter === 'top_rated' && styles.filterChipActive]}
            onPress={() => setFilter('top_rated')}
            activeOpacity={0.7}
          >
            <Star size={12} color={filter === 'top_rated' ? '#FFFFFF' : '#0F172A'} fill={filter === 'top_rated' ? '#FFFFFF' : '#0F172A'} style={{ marginRight: 4 }} />
            <Text style={[styles.filterChipText, filter === 'top_rated' && styles.filterChipTextActive]}>
              Top Rated (4.85+)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* FLOATING GPS RECENTER BUTTON */}
      <TouchableOpacity style={styles.recenterBtn} activeOpacity={0.8} onPress={handleRecenter}>
        <Navigation size={18} color="#0F172A" />
      </TouchableOpacity>

      {/* BOTTOM FLOATING CAROUSEL */}
      <View style={styles.bottomCarouselContainer}>
        <View style={styles.carouselHeaderRow}>
          <Text style={styles.carouselSectionTitle}>
            {filteredItems.length} Home Kitchens near Begur
          </Text>
          <View style={styles.locationPill}>
            <MapPin size={11} color="#64748B" />
            <Text style={styles.locationTag}>Begur, Bengaluru</Text>
          </View>
        </View>

        {filteredItems.length > 0 ? (
          <ScrollView
            ref={carouselRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselScroll}
            decelerationRate="fast"
            snapToInterval={285}
          >
            {filteredItems.map((item, index) => {
              const isSelected = item.id === selectedId;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, isSelected && styles.cardSelected]}
                  activeOpacity={0.9}
                  onPress={() => handleSelectCard(item, index)}
                >
                  <View style={styles.cardImageContainer}>
                    <Image source={resolveImageSource(item.image)} style={styles.cardImage} />
                    
                    {/* FSSAI Indicator */}
                    <View style={styles.fssaiBadge}>
                      <View style={[styles.fssaiSquare, item.isVeg ? styles.vegSquare : styles.nonVegSquare]}>
                        <View style={[styles.fssaiDot, item.isVeg ? styles.vegDot : styles.nonVegDot]} />
                      </View>
                    </View>

                    <View style={styles.cardRatingBadge}>
                      <Star size={11} color="#0F172A" fill="#0F172A" />
                      <Text style={styles.cardRatingText}>{item.rating}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                      {item.verified && (
                        <CheckCircle2 size={15} color="#16A34A" style={{ marginLeft: 4 }} />
                      )}
                    </View>

                    <Text style={styles.cardCuisines} numberOfLines={1}>{item.cuisinesOrDish}</Text>

                    <View style={styles.cardFooter}>
                      <View>
                        <Text style={styles.cardDistance}>{item.distanceKm} km away</Text>
                        <Text style={styles.cardPrice}>{item.priceText}</Text>
                      </View>

                      <TouchableOpacity 
                        style={styles.actionBtn}
                        activeOpacity={0.8}
                        onPress={() => router.push(item.route as any)}
                      >
                        <Text style={styles.actionBtnText}>View Menu</Text>
                        <ArrowRight size={13} color="#FFFFFF" style={{ marginLeft: 2 }} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyMapCard}>
            <View style={styles.emptyMapIconCircle}>
              <UtensilsCrossed size={20} color="#5F259F" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.emptyMapTitle}>No Home Kitchens Online in Begur</Text>
              <Text style={styles.emptyMapSub}>Fresh home meals are prepared daily for lunch and dinner.</Text>
              <TouchableOpacity 
                style={styles.emptyMapBtn}
                onPress={() => router.push("/onboarding?type=home_cook")}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyMapBtnText}>Open Your Home Kitchen</Text>
                <ArrowRight size={13} color="#FFFFFF" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  mapFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  nativeFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  nativeFallbackText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 10,
  },
  nativeFallbackSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  filterFloatingBar: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  vegIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  nonVegIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    marginRight: 6,
  },
  recenterBtn: {
    position: 'absolute',
    right: 16,
    top: 60,
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 1000,
  },
  bottomCarouselContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  carouselHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  carouselSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  carouselScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 270,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardSelected: {
    borderColor: '#0F172A',
    borderWidth: 1.5,
  },
  cardImageContainer: {
    height: 110,
    width: '100%',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fssaiBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 4,
  },
  fssaiSquare: {
    width: 13,
    height: 13,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3,
  },
  fssaiDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  vegSquare: {
    borderColor: '#16A34A',
  },
  vegDot: {
    backgroundColor: '#16A34A',
  },
  nonVegSquare: {
    borderColor: '#DC2626',
  },
  nonVegDot: {
    backgroundColor: '#DC2626',
  },
  cardRatingBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardRatingText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  cardCuisines: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  cardDistance: {
    fontSize: 11,
    color: '#64748B',
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionBtn: {
    backgroundColor: '#5F259F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyMapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  emptyMapIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMapTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  emptyMapSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  emptyMapBtn: {
    backgroundColor: '#5F259F',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emptyMapBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

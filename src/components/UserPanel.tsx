import { Calendar, Building2, MapPin, Ticket, ShieldAlert, ArrowLeft, Download, RefreshCw, Coins, UtensilsCrossed, HelpCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { Booking, Show, Movie, UserProfile, FoodOrderItem } from "../types";
import { formatCurrency, generateVisualQRCodeSVG } from "../utils";

interface UserPanelProps {
  currentUser: UserProfile;
  bookings: Booking[];
  onCancelBooking: (bookingId: string, showId: string, seatsToRelease: string[]) => Promise<void>;
  onNavigateHome: () => void;
  shows?: Show[];
  movies?: Movie[];
  onNavigateLostFound: () => void;
  waitlistEntries?: any[];
  onLeaveWaitlist?: (entryId: string) => Promise<void>;
}

export default function UserPanel({
  currentUser,
  bookings,
  shows,
  onCancelBooking,
  onNavigateHome,
  onNavigateLostFound,
  waitlistEntries = [],
  onLeaveWaitlist,
}: UserPanelProps) {
  const { t } = useTranslation();
  const isCancellable = (booking: Booking) => {
    return !booking.isCancelled;
  };

  // Helper to handle print/download stub
  const triggerPrintStub = (bookingId: string, displayId: string) => {
    const originalContent = document.body.innerHTML;
    const printElement = document.getElementById(`ticket-stub-${bookingId}`);
    if (printElement) {
      const printHtml = printElement.innerHTML;
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Print Leature Movies Coupon Ticket</title>
              <style>
                body { background: #000; color: #fff; font-family: sans-serif; text-align: center; padding: 40px; }
                .ticket-box { border: 2px dashed #f59e0b; padding: 30px; display: inline-block; border-radius: 16px; background: #111; }
                img { max-width: 140px; border-radius: 8px; margin-bottom: 12px; }
                .title { font-weight: bold; font-size: 24px; color: #f59e0b; margin-bottom: 6px; }
                .meta { font-size: 14px; margin-bottom: 15px; color: #999; }
                .seats { font-size: 18px; font-weight: bold; letter-spacing: 2px; color: #fff; background: #222; padding: 6px 12px; display: inline-block; border-radius: 6px; }
                .qr { margin-top: 15px; width: 150px; height: 150px; }
              </style>
            </head>
            <body>
              <div class="ticket-box">
                <div class="title">LEATURE MOVIES</div>
                <div class="meta">Cinema Boarding Pass</div>
                <img src="${printElement.getAttribute("data-poster")}" />
                <div class="title">${printElement.getAttribute("data-title")}</div>
                <div>Theatre: ${printElement.getAttribute("data-theatre")} (Screen ${printElement.getAttribute("data-screen")})</div>
                <div>Date: ${printElement.getAttribute("data-date")} at ${printElement.getAttribute("data-time")}</div>
                <div style="margin-top:20px;">Seats:</div>
                <div class="seats">${printElement.getAttribute("data-seats")}</div>
                ${printElement.getAttribute("data-food-summary") ? `<div style="margin-top:15px; font-weight:bold; color:#f59e0b;">Food Pre-order:</div><div style="font-size:14px; color:#ddd; margin-top:5px;">${printElement.getAttribute("data-food-summary")}</div>` : ""}
                <div><img class="qr" src="${printElement.getAttribute("data-qr")}" /></div>
                <div style="font-size:10px; color:#555; margin-top:15px;">REF ID: ${displayId}</div>
              </div>
            </body>
          </html>
        `);
        win.document.close();
        win.focus();
        win.print();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-stone-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Navigation title breadcrumb */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateHome}
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:text-[#C5A059] cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-100 tracking-wide">
                {t('user.bookingCorridorTitle')}
              </h1>
              <p className="text-stone-400 text-xs mt-1">
                {t('user.bookingCorridorSubtitle')}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="px-4 py-2 bg-gradient-to-r from-[#C5A059]/10 to-[#F1D299]/5 border border-[#C5A059]/30 rounded-xl flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#C5A059]" />
              <span className="text-xs font-mono font-bold text-[#C5A059]">
                {currentUser.rewardCoins || 0} Coins
              </span>
            </div>
            <button
              onClick={onNavigateLostFound}
              className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-semibold rounded-xl tracking-wide flex items-center gap-2 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {t('user.lostFoundStatus')}
            </button>
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 text-stone-400 hover:text-stone-200 border border-white/5 bg-white/3 hover:bg-white/10 text-xs font-semibold rounded-xl tracking-wide flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t('user.backToCatalog')}
            </button>
          </div>
        </div>

        {/* Bookings block */}
        <div className="flex flex-col gap-6">
          {bookings.map((booking) => {
            const displayId = booking.qrCodeUrl || booking.id;
            const qrUri = generateVisualQRCodeSVG(displayId);
            const seatsList = booking.seatNumbers.join(", ");
            const isBookingDateAvailable = !!booking.bookingDate;
            const bookingDateStr = isBookingDateAvailable ? new Date(booking.bookingDate).toLocaleDateString('en-CA') : 'N/A';
            const bookingTimeStr = isBookingDateAvailable ? new Date(booking.bookingDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
            const hasFood = booking.foodOrderItems && booking.foodOrderItems.length > 0;
            const foodOrderText = hasFood
              ? booking.foodOrderItems!.map((f) => `${f.quantity}x ${f.foodName}`).join(", ")
              + (booking.foodDeliveryOption === 'seat' ? ' [Delivery to Seat]' : ' [Counter Pickup]')
              : "";

            return (
              <div
                key={booking.id}
                id={`ticket-stub-${booking.id}`}
                data-title={booking.movieTitle}
                data-theatre={booking.theatreName}
                data-screen={booking.screenNumber}
                data-date={booking.showDate.split('T')[0]}
                data-time={booking.showTime}
                data-seats={seatsList}
                data-poster={booking.moviePoster}
                data-qr={qrUri}
                data-food-summary={foodOrderText}
                className={`group glass-card rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center md:items-stretch shadow-2xl relative overflow-hidden transition-all ${booking.isCancelled
                    ? "border-red-500/20 opacity-70 bg-red-950/5"
                    : "hover:border-[#C5A059]/30"
                  }`}
              >
                {/* Visual side highlights */}
                <span
                  className={`absolute left-0 top-0 bottom-0 w-1 ${booking.isCancelled
                      ? "bg-red-500"
                      : booking.paymentStatus === "Success"
                        ? "bg-[#C5A059]"
                        : "bg-stone-600"
                    }`}
                />

                {/* Cover poster */}
                <img
                  src={booking.moviePoster}
                  alt={booking.movieTitle}
                  className="w-28 h-40 object-cover rounded-2xl shadow-lg border border-white/5 shrink-0 self-center md:self-auto bg-stone-950"
                  referrerPolicy="no-referrer"
                />

                {/* Ticket data Details */}
                <div className="flex-1 flex flex-col justify-between text-center md:text-left gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono tracking-widest text-[#C5A059] font-bold block uppercase">
                      {t('user.reservationReference')}: {displayId}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-100 group-hover:text-[#F1D299] transition-all">
                      {booking.movieTitle}
                    </h2>
                    <p className="text-xs font-mono uppercase tracking-wider text-[#C5A059] font-bold flex items-center justify-center md:justify-start gap-1.5 mt-1">
                      <Building2 className="w-4 h-4 shrink-0" />
                      {booking.theatreName} (Screen {booking.screenNumber})
                    </p>
                  </div>

                  {/* Scheduled Slot Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-black/60 p-4 border border-white/5 rounded-2xl text-xs font-mono">
                    <div>
                      <span className="text-stone-500 block text-[10px]">{t('user.showDate')}</span>
                      <span className="text-stone-300 font-semibold">{booking.showDate.split('T')[0]}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px]">{t('user.showTime')}</span>
                      <span className="text-stone-300 font-semibold">{booking.showTime}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px]">{t('user.seatingLayout')}</span>
                      <span className="text-[#C5A059] font-bold block truncate" title={seatsList}>
                        {seatsList}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px]">{t('user.salesCharge')}</span>
                      <span className="text-stone-300 font-bold">
                        {formatCurrency(booking.totalAmount)}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-4 pt-2 border-t border-stone-800/60 flex justify-between mt-1">
                      <div>
                        <span className="text-stone-500 text-[10px] block">{t('user.bookingDate')}</span>
                        <span className="text-stone-400 font-bold">{bookingDateStr}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-stone-500 text-[10px] block">{t('user.bookingTime')}</span>
                        <span className="text-stone-400 font-bold">{bookingTimeStr}</span>
                      </div>
                    </div>
                  </div>

                  {hasFood && (
                    <div className="bg-[#C5A059]/5 border border-[#C5A059]/20 rounded-xl p-3 text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-[#C5A059] font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                        <UtensilsCrossed className="w-3.5 h-3.5" />
                        {t('user.foodPreOrder')}
                      </div>
                      <div className="text-stone-300 pl-5">
                        {booking.foodOrderItems!.map((item) => (
                          <div key={item.foodId} className="flex justify-between">
                            <span>{item.quantity}x {item.foodName}</span>
                          </div>
                        ))}
                        <div className="mt-1 pt-1 border-t border-[#C5A059]/10 text-[#C5A059]/80 text-[10px]">
                          {booking.foodDeliveryOption === 'seat' ? t('user.foodDeliverySeat') : t('user.foodCollectCounter')}
                          {booking.foodDeliveryFee ? ` (+${formatCurrency(booking.foodDeliveryFee)} ${t('user.deliveryFee')})` : ''}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cancel triggers or download buttons */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1">
                    {!booking.isCancelled && (
                      <button
                        onClick={() => triggerPrintStub(booking.id, displayId)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 hover:text-[#C5A059] border border-white/10 text-stone-300 text-xs font-bold rounded-xl tracking-wide flex items-center gap-1.5 cursor-pointer transition-all shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {t('user.downloadTicket')}
                      </button>
                    )}

                    {isCancellable(booking) && (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              t('user.cancelBookingPrompt', { seats: seatsList })
                            )
                          ) {
                            onCancelBooking(booking.id, booking.showId, booking.seatNumbers);
                          }
                        }}
                        className="px-3.5 py-2 hover:bg-red-500/10 text-red-400 hover:text-red-500 border border-red-500/20 text-xs font-bold rounded-xl tracking-wide flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {t('user.requestCancellation')}
                      </button>
                    )}

                    {booking.isCancelled && (
                      <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest pl-1">
                        ● {t('user.ticketCancelledRefund')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Boarding QR element */}
                <div className="flex flex-col items-center justify-center gap-2 p-3 bg-black/60 border border-white/5 rounded-2xl shrink-0 w-32 h-32 self-center">
                  {!booking.isCancelled ? (
                    <>
                      <div className="p-1 bg-white rounded shadow-md mx-auto inline-block">
                        <QRCodeSVG
                          value={displayId}
                          size={70}
                          bgColor="#ffffff"
                          fgColor="#000000"
                          level="H"
                        />
                      </div>
                      <span className="text-[8px] font-mono font-bold text-[#C5A059] tracking-widest mt-1">
                        {t('user.scanCoupon')}
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-red-500/60 p-4 font-mono text-center">
                      <ShieldAlert className="w-8 h-8" />
                      <span className="text-[9px] uppercase tracking-wider block mt-2">Void</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {bookings.length === 0 && (
            <div className="border border-[#C5A059]/20 border-dashed rounded-3xl py-20 text-center text-stone-500 bg-white/2">
              <Ticket className="w-10 h-10 mx-auto text-stone-700 mb-3 animate-pulse" />
              <h3 className="text-stone-300 font-semibold mb-1">{t('user.emptyCorridorTitle')}</h3>
              <p className="text-stone-500 text-xs max-w-sm mx-auto leading-relaxed mb-4">
                {t('user.emptyCorridorDescription')}
              </p>
              <button
                onClick={onNavigateHome}
                className="px-6 py-2.5 bg-gradient-to-r from-[#C5A059] to-[#F1D299] text-[#050505] text-xs font-bold uppercase tracking-wider rounded-lg shadow-xl cursor-pointer hover:opacity-90 transition-all font-sans"
              >
                {t('user.goBrowseMovies')}
              </button>
            </div>
          )}
        </div>

        {/* Waitlist section */}
        {waitlistEntries && waitlistEntries.length > 0 && (
          <div className="flex flex-col gap-6 mt-8">
            <h2 className="text-2xl font-serif font-bold text-stone-100 tracking-wide border-b border-white/5 pb-4">
              {t('user.activeWaitlists')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {waitlistEntries.map((entry) => (
                <div key={entry.id} className="glass-card p-5 rounded-2xl flex flex-col justify-between gap-3 border border-amber-500/10 hover:border-amber-500/25 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-stone-200 text-sm">{entry.movieTitle}</h3>
                      <p className="text-xs text-stone-400 mt-0.5">{entry.theatreName}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-[9px] font-mono font-bold text-amber-500 rounded-md uppercase">
                      Waiting
                    </span>
                  </div>
                  <div className="text-xs font-mono bg-black/40 p-3 rounded-lg border border-white/5 flex flex-col gap-1 text-stone-400">
                    <div>{t('user.showTimeLabel')}: <span className="text-stone-300 font-bold">{entry.showTime}</span></div>
                    <div>{t('user.waitlistSeats')}: <span className="text-[#C5A059] font-bold">{entry.seatsRequested?.join(", ") || t('user.any')}</span></div>
                    {entry.createdAt && (
                      <div className="text-[10px] text-stone-500 mt-1">{t('user.joinedWaitlist')}: {new Date(entry.createdAt).toLocaleDateString()}</div>
                    )}
                  </div>
                  <div className="flex justify-end mt-1">
                    <button
                      onClick={() => {
                        if (confirm(t('user.leaveWaitlistConfirm'))) {
                          onLeaveWaitlist && onLeaveWaitlist(entry.id);
                        }
                      }}
                      className="px-3 py-1.5 text-[9px] uppercase font-bold tracking-wider hover:bg-red-500/10 text-red-400 hover:text-red-500 border border-red-500/20 rounded-lg transition-all cursor-pointer"
                    >
                      {t('user.leaveQueue')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// 

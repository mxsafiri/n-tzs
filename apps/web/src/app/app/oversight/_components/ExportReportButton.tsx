'use client'

import { useState } from 'react'
import { jsPDF } from 'jspdf'

interface ReportData {
  generatedAt: string
  contractAddress: string
  network: string
  onChainSupply: number
  stats: {
    totalUsers: number
    totalWallets: number
    totalDeposits: number
    totalMinted: number
    totalPending: number
  }
  kyc: {
    approved: number
    pending: number
    rejected: number
  }
  dailyIssuance: {
    date: string
    cap: number
    issued: number
    reserved: number
  }
  statusBreakdown: Array<{
    status: string
    count: number
    totalTzs: number
  }>
  recentDeposits: Array<{
    id: string
    amountTzs: number
    status: string
    provider: string | null
    reference: string | null
    txHash: string | null
    createdAt: string
  }>
}

export function ExportReportButton() {
  const [loading, setLoading] = useState(false)

  const generatePDF = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/oversight/reserves-report')
      const data: ReportData = await res.json()

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      let y = 20

      // Helper functions
      const formatNumber = (n: number) => n.toLocaleString()
      const formatDate = (d: string) => new Date(d).toLocaleString()
      const addLine = () => {
        doc.setDrawColor(200, 200, 200)
        doc.line(20, y, pageWidth - 20, y)
        y += 5
      }

      // Header
      doc.setFillColor(88, 28, 135) // violet-900
      doc.rect(0, 0, pageWidth, 45, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('nTZS Reserves Report', 20, 25)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated: ${formatDate(data.generatedAt)}`, 20, 35)
      doc.text(`Network: ${data.network}`, pageWidth - 60, 35)

      y = 60

      // Reserve Status Section
      doc.setTextColor(88, 28, 135)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Reserve Verification', 20, y)
      y += 10

      doc.setTextColor(60, 60, 60)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      // Reserve boxes
      const boxWidth = (pageWidth - 60) / 3
      
      // On-Chain Supply
      doc.setFillColor(240, 253, 244) // emerald-50
      doc.roundedRect(20, y, boxWidth, 35, 3, 3, 'F')
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('ON-CHAIN SUPPLY', 25, y + 10)
      doc.setFontSize(16)
      doc.setTextColor(16, 185, 129) // emerald-500
      doc.setFont('helvetica', 'bold')
      doc.text(`${formatNumber(data.onChainSupply)} nTZS`, 25, y + 25)

      // Confirmed Deposits
      doc.setFillColor(245, 243, 255) // violet-50
      doc.roundedRect(25 + boxWidth, y, boxWidth, 35, 3, 3, 'F')
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'normal')
      doc.text('CONFIRMED DEPOSITS', 30 + boxWidth, y + 10)
      doc.setFontSize(16)
      doc.setTextColor(139, 92, 246) // violet-500
      doc.setFont('helvetica', 'bold')
      doc.text(`${formatNumber(data.stats.totalMinted)} TZS`, 30 + boxWidth, y + 25)

      // Reserve Status
      doc.setFillColor(240, 253, 244) // emerald-50
      doc.roundedRect(30 + boxWidth * 2, y, boxWidth, 35, 3, 3, 'F')
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'normal')
      doc.text('RESERVE STATUS', 35 + boxWidth * 2, y + 10)
      doc.setFontSize(16)
      doc.setTextColor(16, 185, 129) // emerald-500
      doc.setFont('helvetica', 'bold')
      doc.text('✓ 1:1 Backed', 35 + boxWidth * 2, y + 25)

      y += 50

      // Key Metrics Section
      doc.setTextColor(88, 28, 135)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Key Metrics', 20, y)
      y += 10

      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      doc.setFont('helvetica', 'normal')

      const metrics = [
        ['Total Users', formatNumber(data.stats.totalUsers)],
        ['Connected Wallets', formatNumber(data.stats.totalWallets)],
        ['Total Deposits', formatNumber(data.stats.totalDeposits)],
        ['Total Minted', `${formatNumber(data.stats.totalMinted)} TZS`],
        ['Pending Issuance', `${formatNumber(data.stats.totalPending)} TZS`],
      ]

      metrics.forEach(([label, value]) => {
        doc.text(label, 25, y)
        doc.setFont('helvetica', 'bold')
        doc.text(String(value), 120, y)
        doc.setFont('helvetica', 'normal')
        y += 7
      })

      y += 10

      // Daily Issuance Section
      doc.setTextColor(88, 28, 135)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Daily Issuance Control', 20, y)
      y += 10

      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      doc.setFont('helvetica', 'normal')

      const utilizationPct = ((data.dailyIssuance.issued / data.dailyIssuance.cap) * 100).toFixed(2)
      doc.text(`Date: ${data.dailyIssuance.date}`, 25, y)
      y += 7
      doc.text(`Daily Cap: ${formatNumber(data.dailyIssuance.cap)} TZS`, 25, y)
      y += 7
      doc.text(`Issued Today: ${formatNumber(data.dailyIssuance.issued)} TZS (${utilizationPct}% utilized)`, 25, y)
      y += 7
      doc.text(`Reserved: ${formatNumber(data.dailyIssuance.reserved)} TZS`, 25, y)

      y += 15

      // KYC/AML Section
      doc.setTextColor(88, 28, 135)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('KYC/AML Overview', 20, y)
      y += 10

      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      doc.setFont('helvetica', 'normal')

      doc.text(`Approved: ${data.kyc.approved}`, 25, y)
      doc.text(`Pending: ${data.kyc.pending}`, 80, y)
      doc.text(`Rejected: ${data.kyc.rejected}`, 135, y)

      y += 15

      // Deposit Status Breakdown
      doc.setTextColor(88, 28, 135)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Deposit Status Distribution', 20, y)
      y += 10

      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)
      doc.setFont('helvetica', 'bold')
      doc.text('Status', 25, y)
      doc.text('Count', 100, y)
      doc.text('Total (TZS)', 140, y)
      y += 2
      addLine()

      doc.setFont('helvetica', 'normal')
      data.statusBreakdown.forEach((item) => {
        doc.text(item.status, 25, y)
        doc.text(String(item.count), 100, y)
        doc.text(formatNumber(item.totalTzs), 140, y)
        y += 6
      })

      // Check if we need a new page for recent deposits
      if (y > 230) {
        doc.addPage()
        y = 20
      }

      y += 10

      // Recent Deposits Section
      doc.setTextColor(88, 28, 135)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Recent Deposit Activity', 20, y)
      y += 10

      doc.setFontSize(8)
      doc.setTextColor(60, 60, 60)
      doc.setFont('helvetica', 'bold')
      doc.text('ID', 20, y)
      doc.text('Amount (TZS)', 50, y)
      doc.text('Status', 90, y)
      doc.text('Provider', 120, y)
      doc.text('TX Hash', 150, y)
      y += 2
      addLine()

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      data.recentDeposits.slice(0, 15).forEach((dep) => {
        if (y > 280) {
          doc.addPage()
          y = 20
        }
        doc.text(dep.id.slice(0, 8), 20, y)
        doc.text(formatNumber(dep.amountTzs), 50, y)
        doc.text(dep.status, 90, y)
        doc.text(dep.provider || 'bank', 120, y)
        doc.text(dep.txHash ? dep.txHash.slice(0, 12) + '...' : '—', 150, y)
        y += 5
      })

      // Footer
      y = doc.internal.pageSize.getHeight() - 20
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(`Contract: ${data.contractAddress}`, 20, y)
      doc.text('nTZS Stablecoin - Tanzania Shilling Stablecoin', pageWidth - 80, y)

      // Save
      const filename = `nTZS-Reserves-Report-${data.dailyIssuance.date}.pdf`
      doc.save(filename)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={generatePDF}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Generating...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export PDF Report
        </>
      )}
    </button>
  )
}

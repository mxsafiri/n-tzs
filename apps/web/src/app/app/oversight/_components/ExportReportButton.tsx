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

      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const marginX = 48
      const marginTop = 92
      const footerH = 44
      const contentW = pageWidth - marginX * 2
      let y = marginTop
      let pageNo = 1

      // Helper functions
      const formatNumber = (n: number) => n.toLocaleString()
      const formatDate = (d: string) => new Date(d).toLocaleString()
      const toPct = (num: number, den: number) => (den > 0 ? ((num / den) * 100).toFixed(2) : '0.00')

      const COLOR = {
        blue: [10, 64, 170] as const,
        blueDark: [9, 48, 126] as const,
        text: [15, 23, 42] as const,
        muted: [100, 116, 139] as const,
        line: [226, 232, 240] as const,
        surface: [248, 250, 252] as const,
        rowAlt: [241, 245, 249] as const,
        white: [255, 255, 255] as const,
        green: [16, 185, 129] as const,
        red: [239, 68, 68] as const,
      }

      const setFill = (rgb: readonly [number, number, number]) => doc.setFillColor(rgb[0], rgb[1], rgb[2])
      const setDraw = (rgb: readonly [number, number, number]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2])
      const setText = (rgb: readonly [number, number, number]) => doc.setTextColor(rgb[0], rgb[1], rgb[2])

      const header = () => {
        setFill(COLOR.blue)
        doc.rect(0, 0, pageWidth, 72, 'F')

        setText(COLOR.white)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(20)
        doc.text('nTZS Reserves & Transparency Report', marginX, 30)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text(`Generated: ${formatDate(data.generatedAt)}`, marginX, 52)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        const rightMeta = `Network: ${data.network}`
        doc.text(rightMeta, pageWidth - marginX - doc.getTextWidth(rightMeta), 52)

        y = marginTop
      }

      const footer = (pageNumber: number) => {
        const baseY = pageHeight - 18
        setText(COLOR.muted)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        const left = `Contract: ${data.contractAddress}`
        doc.text(left, marginX, baseY)
        const right = `Page ${pageNumber}`
        doc.text(right, pageWidth - marginX - doc.getTextWidth(right), baseY)
      }

      const ensureSpace = (needed: number) => {
        if (y + needed <= pageHeight - footerH) return
        footer(pageNo)
        doc.addPage()
        pageNo += 1
        header()
      }

      const sectionTitle = (title: string, subtitle?: string) => {
        ensureSpace(48)
        setText(COLOR.text)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13)
        doc.text(title, marginX, y)
        y += 14
        if (subtitle) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          setText(COLOR.muted)
          doc.text(subtitle, marginX, y)
          y += 14
        } else {
          y += 6
        }
        setDraw(COLOR.line)
        doc.line(marginX, y, marginX + contentW, y)
        y += 16
      }

      const metricGrid = (items: Array<{ label: string; value: string; hint?: string; tone?: 'default' | 'good' | 'bad' }>) => {
        const cols = 3
        const gap = 12
        const cardW = (contentW - gap * (cols - 1)) / cols
        const cardH = 68
        ensureSpace(cardH + 10)

        items.forEach((it, idx) => {
          const col = idx % cols
          const row = Math.floor(idx / cols)
          const x = marginX + col * (cardW + gap)
          const yy = y + row * (cardH + gap)

          setFill(COLOR.surface)
          setDraw(COLOR.line)
          doc.roundedRect(x, yy, cardW, cardH, 10, 10, 'FD')

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          setText(COLOR.muted)
          doc.text(it.label.toUpperCase(), x + 12, yy + 18)

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(14)
          const tone = it.tone || 'default'
          if (tone === 'good') setText(COLOR.green)
          else if (tone === 'bad') setText(COLOR.red)
          else setText(COLOR.text)
          doc.text(it.value, x + 12, yy + 40)

          if (it.hint) {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(8)
            setText(COLOR.muted)
            doc.text(it.hint, x + 12, yy + 56)
          }
        })

        const rows = Math.ceil(items.length / cols)
        y += rows * (cardH + gap) - gap
        y += 16
      }

      const drawTable = (opts: {
        title?: string
        columns: Array<{ header: string; width: number; align?: 'left' | 'right' | 'center' }>
        rows: Array<Array<string>>
      }) => {
        const headerH = 22
        const rowH = 18
        const tableW = opts.columns.reduce((acc, c) => acc + c.width, 0)

        if (opts.title) sectionTitle(opts.title)

        ensureSpace(headerH + rowH * Math.min(8, opts.rows.length) + 20)

        const x0 = marginX
        setFill(COLOR.blueDark)
        doc.roundedRect(x0, y, tableW, headerH, 8, 8, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        setText(COLOR.white)

        let cx = x0
        opts.columns.forEach((c) => {
          const pad = 10
          const align = c.align || 'left'
          const textY = y + 15
          if (align === 'right') {
            doc.text(c.header, cx + c.width - pad - doc.getTextWidth(c.header), textY)
          } else if (align === 'center') {
            doc.text(c.header, cx + c.width / 2 - doc.getTextWidth(c.header) / 2, textY)
          } else {
            doc.text(c.header, cx + pad, textY)
          }
          cx += c.width
        })

        y += headerH

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        setText(COLOR.text)

        opts.rows.forEach((row, idx) => {
          ensureSpace(rowH + 10)
          if (idx % 2 === 0) {
            setFill(COLOR.rowAlt)
            doc.rect(x0, y, tableW, rowH, 'F')
          }

          let colX = x0
          row.forEach((cell, cIdx) => {
            const col = opts.columns[cIdx]
            const pad = 10
            const align = col.align || 'left'
            const textY = y + 13
            if (align === 'right') {
              doc.text(cell, colX + col.width - pad - doc.getTextWidth(cell), textY)
            } else if (align === 'center') {
              doc.text(cell, colX + col.width / 2 - doc.getTextWidth(cell) / 2, textY)
            } else {
              doc.text(cell, colX + pad, textY)
            }
            colX += col.width
          })

          setDraw(COLOR.line)
          doc.line(x0, y + rowH, x0 + tableW, y + rowH)
          y += rowH
        })

        y += 14
      }

      header()

      sectionTitle('Executive summary', 'A concise view of reserves, issuance controls, and operational compliance.')

      const utilizationPct = toPct(data.dailyIssuance.issued, data.dailyIssuance.cap)
      metricGrid([
        {
          label: 'On-chain supply',
          value: `${formatNumber(data.onChainSupply)} nTZS`,
          hint: 'Verified on Base Sepolia',
        },
        {
          label: 'Confirmed reserves',
          value: `${formatNumber(data.stats.totalMinted)} TZS`,
          hint: 'Confirmed deposits',
        },
        {
          label: 'Reserve status',
          value: '1:1 Backed',
          hint: 'Supply reconciled',
          tone: 'good',
        },
        {
          label: 'Daily cap utilization',
          value: `${utilizationPct}%`,
          hint: `Issued today: ${formatNumber(data.dailyIssuance.issued)} TZS`,
        },
        {
          label: 'Pending issuance',
          value: `${formatNumber(data.stats.totalPending)} TZS`,
          hint: 'Awaiting confirmation',
        },
        {
          label: 'KYC verified',
          value: `${formatNumber(data.kyc.approved)}`,
          hint: `Pending: ${formatNumber(data.kyc.pending)} · Rejected: ${formatNumber(data.kyc.rejected)}`,
        },
      ])

      sectionTitle('Reserve verification', 'nTZS reserves are intended to fully cover the on-chain token supply.')
      drawTable({
        columns: [
          { header: 'Item', width: 260 },
          { header: 'Value', width: 210, align: 'right' },
          { header: 'Notes', width: 210 },
        ],
        rows: [
          ['On-chain supply', `${formatNumber(data.onChainSupply)} nTZS`, 'Total supply from contract'],
          ['Confirmed deposits', `${formatNumber(data.stats.totalMinted)} TZS`, 'Reconciled deposits'],
          ['Pending issuance', `${formatNumber(data.stats.totalPending)} TZS`, 'Awaiting settlement'],
          ['Reserve status', '1:1 backed', 'Operational confirmation'],
        ],
      })

      sectionTitle('Issuance controls', 'Daily issuance caps help enforce operational risk limits.')
      drawTable({
        columns: [
          { header: 'Date', width: 140 },
          { header: 'Daily cap (TZS)', width: 180, align: 'right' },
          { header: 'Issued today (TZS)', width: 190, align: 'right' },
          { header: 'Utilization', width: 170, align: 'right' },
        ],
        rows: [
          [
            data.dailyIssuance.date,
            formatNumber(data.dailyIssuance.cap),
            formatNumber(data.dailyIssuance.issued),
            `${utilizationPct}%`,
          ],
        ],
      })

      sectionTitle('Compliance posture', 'Identity verification and access controls support compliant issuance workflows.')
      drawTable({
        columns: [
          { header: 'Category', width: 260 },
          { header: 'Count', width: 420, align: 'right' },
        ],
        rows: [
          ['KYC approved', formatNumber(data.kyc.approved)],
          ['KYC pending', formatNumber(data.kyc.pending)],
          ['KYC rejected', formatNumber(data.kyc.rejected)],
          ['Registered users', formatNumber(data.stats.totalUsers)],
          ['Connected wallets', formatNumber(data.stats.totalWallets)],
        ],
      })

      sectionTitle('Deposit pipeline', 'Status breakdown across the deposit-to-issuance lifecycle.')
      drawTable({
        columns: [
          { header: 'Status', width: 240 },
          { header: 'Count', width: 160, align: 'right' },
          { header: 'Total (TZS)', width: 280, align: 'right' },
        ],
        rows: data.statusBreakdown.map((s) => [s.status, formatNumber(s.count), formatNumber(s.totalTzs)]),
      })

      sectionTitle('Recent deposit activity', 'A sample of the most recent deposits and their on-chain settlement references.')
      drawTable({
        columns: [
          { header: 'Deposit ID', width: 120 },
          { header: 'Amount (TZS)', width: 140, align: 'right' },
          { header: 'Status', width: 120 },
          { header: 'Provider', width: 120 },
          { header: 'TX', width: 220 },
        ],
        rows: data.recentDeposits.slice(0, 12).map((d) => [
          d.id.slice(0, 8),
          formatNumber(d.amountTzs),
          d.status,
          d.provider || 'bank',
          d.txHash ? `${d.txHash.slice(0, 18)}…` : '—',
        ]),
      })

      footer(pageNo)

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
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50"
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

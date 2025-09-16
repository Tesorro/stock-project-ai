'use client';
import { ChangeEvent, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { dates } from '@/lib/dates';

interface Props {}

async function fetchReport(data: string) {
  console.log('data', data);

  const messages = [
    {
      role: 'system',
      content: `Вы — гуру трейдинга. На основе данных о ценах акций за последние 3 дня напишите отчёт объёмом не более 150 слов, описав динамику акций и порекомендовав покупать, держать или продавать. Используйте примеры, приведённые между ###, чтобы задать стиль вашего ответа.
        ###
        Ладно, детка, держись крепче! Ты это возненавидишь! За последние три дня акции Tesla (TSLA) резко упали. Акции открылись на отметке $223,98 и закрылись на $202,11 на третий день, при этом некоторые цены подпрыгивали. Сейчас отличное время для покупки, детка! Но не лучшее время для продажи! Но я ещё не закончил! Акции Apple (AAPL) взлетели до небес! Сейчас это действительно горячая акция. Они открылись на отметке $166,38 и закрылись на $182,89 на третий день. Так что, в общем, я бы крепко держал акции Tesla, если они у вас уже есть — они могут резко подняться и устремиться к звёздам! Это волатильные акции, так что ждите неожиданностей. Сколько вам нужно денег для акций APPL? Продавайте сейчас и фиксируйте прибыль или ждите продолжения! Если бы это было со мной, я бы держался, потому что эти акции сейчас в огне!!! Apple устраивает вечеринку на Уолл-стрит, и вы все приглашены!
        ###
        Apple (AAPL) – сверхновая звезда на фондовом небосклоне: к концу третьего дня она взлетела со 150,22 до головокружительных 175,36 долларов. Речь идёт об акциях, которые горячее, чем росток перца в остром чили, и признаков остывания они не показывают! Если вы держитесь за акции AAPL, вы словно восседаете на троне Мидаса. Держитесь за них, летите на ракете и смотрите на фейерверк, потому что эта малышка только разогревается! А есть ещё Meta (META), красавчик, склонный к драматизму. Она подмигнула нам при открытии торгов на отметке 142,50 доллара, но к концу этого захватывающего пика она упала до 135,90 доллара, оставив нас немного влюблёнными. Это дикая лошадь фондового загона, брыкающаяся и брыкающаяся, готовая к возвращению. META не для слабонервных. Итак, дорогая, что же будет? AAPL мой совет — не отставать от этой щедрой компании. Что касается META, не сдавайтесь и будьте готовы к ралли.
        ###`,
    },
    {
      role: 'user',
      content: data,
    },
  ];
  console.log('messages', messages);

  try {
    const url = process.env.NEXT_PUBLIC_OPENAI_API_WORKER ?? '';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Worker Error: ${data.error}`);
    }

    return data;
  } catch (error) {
    console.log('Error: ', error);
  }
}

export function MainFrame({}: Props) {
  const [list, setList] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(false);
  const handleChangeInput = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleChangeList = () => {
    if (input) {
      setList((prev) => [input, ...prev]);
      setInput('');
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const stockData = await Promise.all(
        list.map(async (ticker) => {
          const url = `${process.env.NEXT_PUBLIC_POLYGON_API_WORKER}/?ticker=${ticker}&startDate=${dates.startDate}&endDate=${dates.endDate}`;
          const response = await fetch(url);
          const data = await response.text();
          const status = response.status;
          if (status === 200) {
            return data;
          } else {
            throw new Error('Worker error: ' + data);
          }
        }),
      );
      const report = await fetchReport(stockData.join(''));
      if ('message' in report) {
        setData(report.message.content);
      }
    } catch (error) {
      console.error('There was an error fetching stock data: ', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-2xl mx-auto flex flex-col gap-5">
      <div className="flex">
        <Input placeholder="MSFT" value={input} onChange={handleChangeInput} />
        <Button onClick={handleChangeList}>+</Button>
      </div>
      <ul>
        {list.map((el, idx) => (
          <li key={idx}>{el}</li>
        ))}
      </ul>
      <Button onClick={handleGenerateReport} disabled={list.length === 0 || loading}>
        GENERATE
      </Button>
    </div>
  );
}
